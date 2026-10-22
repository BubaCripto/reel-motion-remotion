import type {Cue,Keyframe,ReelProject,VideoClip} from './project';

export const RHYTHM_TYPES=['pause','jump-cut','punch-in','reframe','broll','cta','hook'] as const;
export type RhythmType=typeof RHYTHM_TYPES[number];
export type RhythmSuggestion={id:string;type:RhythmType;start:number;end:number;title:string;reason:string;text?:string;zoom?:number;x?:number;y?:number;status:'pending'|'applied'|'dismissed'};
export type RhythmSegment={start:number;end:number;score:number;reason:string};
export type RhythmOpening={label:'A'|'B';hookText:string;ctaText:string;reason:string;duration:number;zoom:number;leadTrim:number};
export type RhythmAudio={checked:boolean;silences:{start:number;end:number}[];note:string};
export type RhythmAnalysis={version:1;signature:string;createdAt:string;provider:'ag-local-bridge';model:string;objective:string;hook:{score:number;summary:string;issues:string[]};segments:RhythmSegment[];suggestions:RhythmSuggestion[];openings:RhythmOpening[];audio:RhythmAudio};
export type RhythmVariant={groupId:string;label:'Original'|'A'|'B';primary:boolean};
const id=()=>crypto.randomUUID();
const copy=<T,>(value:T):T=>structuredClone(value);
const limit=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const number=(value:unknown,fallback:number)=>Number.isFinite(Number(value))?Number(value):fallback;
const text=(value:unknown,max=600)=>typeof value==='string'?value.trim().slice(0,max):'';
export const transcriptOf=(p:ReelProject)=>p.cues.filter(c=>c.source==='transcript');
export function rhythmDuration(p:ReelProject){
 return Math.max(1,p.videoDuration||0,...p.clips.map(c=>c.end),...p.cues.map(c=>c.end),...p.overlays.map(o=>o.end));
}
export function rhythmSignature(p:ReelProject){
 const data=JSON.stringify({clips:p.clips.map(c=>[c.id,c.src,c.start,c.end,c.sourceStart,c.speed]),cues:transcriptOf(p).map(c=>[c.id,c.start,c.end,c.text]),duration:rhythmDuration(p)});
 let hash=2166136261;
 for(let i=0;i<data.length;i++)hash=Math.imul(hash^data.charCodeAt(i),16777619);
 return (hash>>>0).toString(16);
}
export function normalizeRhythmResponse(raw:any,p:ReelProject,objective:string,model:string,audio:RhythmAudio):RhythmAnalysis{
 const duration=rhythmDuration(p);
 const span=(value:any)=>{const start=limit(number(value?.start,0),0,duration);return {start,end:limit(number(value?.end,start),start,duration)};};
 if(!raw?.hook||!Number.isFinite(Number(raw.hook.score))||!Array.isArray(raw.segments)||!Array.isArray(raw.suggestions))throw Error('Gemini retornou uma análise de ritmo incompleta. Tente novamente.');
 const segments:RhythmSegment[]=raw.segments.slice(0,200).map((s:any)=>({...span(s),score:Math.round(limit(number(s.score,50),0,100)),reason:text(s.reason)})).filter((s:RhythmSegment)=>s.end>s.start&&s.reason).sort((a:RhythmSegment,b:RhythmSegment)=>a.start-b.start);
 if(!segments.length)throw Error('A análise não trouxe trechos válidos para a timeline.');
 const suggestions:RhythmSuggestion[]=raw.suggestions.slice(0,60).filter((s:any)=>RHYTHM_TYPES.includes(s?.type)).map((s:any)=>({id:id(),type:s.type,...span(s),title:text(s.title,100),reason:text(s.reason),text:text(s.text,240),zoom:limit(number(s.zoom,1.16),1,1.25),x:limit(number(s.x,50),20,80),y:limit(number(s.y,50),20,80),status:'pending' as const})).filter((s:RhythmSuggestion)=>s.end-s.start>=.08&&s.title&&s.reason);
 for(const suggestion of suggestions)if(suggestion.type==='cta'){suggestion.start=Math.max(0,duration-3);suggestion.end=duration;}
 const openings:RhythmOpening[]=(Array.isArray(raw.openings)?raw.openings:[]).slice(0,2).map((o:any,i:number)=>({label:i===0?'A':'B',hookText:text(o.hookText,160),ctaText:text(o.ctaText,180),reason:text(o.reason),duration:limit(number(o.duration,4),Math.min(3,duration),Math.min(5,duration)),zoom:limit(number(o.zoom,1.12),1,1.25),leadTrim:limit(number(o.leadTrim,0),0,Math.min(2,duration-.2))})).filter((o:RhythmOpening)=>o.hookText&&o.ctaText);
 // A/B variants can trim only a leading silence actually measured in the audio.
 for(const opening of openings){const leading=audio.checked?audio.silences.find(s=>s.start<=.05):undefined;opening.leadTrim=leading?Math.min(opening.leadTrim,Math.max(0,leading.end-.08)):0;}
 return {version:1,signature:rhythmSignature(p),createdAt:new Date().toISOString(),provider:'ag-local-bridge',model,objective:objective.slice(0,1500),hook:{score:Math.round(limit(Number(raw.hook.score),0,100)),summary:text(raw.hook.summary),issues:(Array.isArray(raw.hook.issues)?raw.hook.issues:[]).map((s:unknown)=>text(s)).filter(Boolean).slice(0,10)},segments,suggestions,openings,audio};
}

const at=(keys:Keyframe[]|undefined,time:number,prop:'x'|'y'|'scale',fallback:number)=>{
 const points=(keys||[]).filter(k=>typeof k[prop]==='number').sort((a,b)=>a.time-b.time);
 if(!points.length)return fallback;
 if(time<=points[0].time)return points[0][prop]!;
 for(let i=1;i<points.length;i++)if(time<=points[i].time){const a=points[i-1],b=points[i],t=limit((time-a.time)/(b.time-a.time||1),0,1),ease=t*t*(3-2*t);return a[prop]!+(b[prop]!-a[prop]!)*ease;}
 return points[points.length-1][prop]!;
};
const compactKeys=(keys:Keyframe[])=>Array.from(new Map(keys.sort((a,b)=>a.time-b.time).map(k=>[k.time,k])).values());

/** One accepted edit, applied to a copy. Source media and authored text are never deleted. */
export function cutRhythmRange(p:ReelProject,start:number,end:number):ReelProject{
 const duration=rhythmDuration(p),step=1/p.fps;
 start=limit(start,0,duration);end=limit(end,start,duration);
 if(end-start<step||duration-(end-start)<step)throw Error('O corte deve preservar ao menos um frame do projeto.');
 const removed=end-start,map=(t:number)=>t<=start?t:t>=end?t-removed:start;
 const newDuration=Math.max(step,duration-removed);
 const range=(a:number,b:number)=>{const s=limit(map(a),0,Math.max(0,newDuration-step));return {start:s,end:Math.min(newDuration,Math.max(s+step,map(b)))};};
 const keys=(list:Keyframe[]|undefined)=>list?.map(k=>({...k,time:map(k.time)}));
 const intervals=(a:number,b:number)=>[{start:a,end:Math.min(b,start)},{start:Math.max(a,end),end:b}].filter(s=>s.end-s.start>=step-.000001);
 const clips=p.clips.flatMap(c=>intervals(c.start,c.end).map((s,i)=>({...c,id:i?id():c.id,start:map(s.start),end:map(s.end),sourceStart:c.sourceStart+(s.start-c.start)*c.speed,keyframes:keys(c.keyframes)})));
 const cues=p.cues.flatMap(c=>{
  if(c.source!=='transcript')return [{...c,...range(c.start,c.end),keyframes:keys(c.keyframes)}];
  return intervals(c.start,c.end).map((s,i)=>{
   const words=c.words?.filter(w=>w.end>s.start&&w.start<s.end).map(w=>({...w,start:map(Math.max(w.start,s.start)),end:map(Math.min(w.end,s.end))}));
   return {...c,id:i?id():c.id,start:map(s.start),end:map(s.end),words,text:words?.length?words.map(w=>w.highlight?`[${w.text}]`:w.text).join(' '):c.text,keyframes:keys(c.keyframes)};
  });
 });
 const next={...p,clips,cues,overlays:p.overlays.map(o=>({...o,...range(o.start,o.end),keyframes:keys(o.keyframes)})),videoDuration:newDuration};
 if(p.editorial){next.editorial={...p.editorial,segments:p.editorial.segments.filter(s=>s.start<start||s.end>end).map(s=>({...s,...range(s.start,s.end)})),suggestions:p.editorial.suggestions.map(s=>({...s,...range(s.start,s.end)}))};}
 return next;
}

function addFraming(p:ReelProject,s:Pick<RhythmSuggestion,'start'|'end'|'zoom'|'x'|'y'|'type'>){
 let touched=false;
 const clips=p.clips.map(c=>{
  const start=Math.max(c.start,s.start),end=Math.min(c.end,s.end);
  if(end-start<1/p.fps)return c;
  touched=true;
  const original=(time:number)=>({time,x:at(c.keyframes,time,'x',c.x??50),y:at(c.keyframes,time,'y',c.y??50),scale:at(c.keyframes,time,'scale',c.zoom??1)});
  const from=original(start),to=original(end),peak=Math.min(end,start+Math.min(.2,(end-start)/3));
  const point={time:peak,x:s.type==='reframe'?(s.x??from.x):from.x,y:s.type==='reframe'?(s.y??from.y):from.y,scale:from.scale*(s.zoom??1.16)};
  return {...c,keyframes:compactKeys([...(c.keyframes||[]).filter(k=>k.time<start||k.time>end),from,point,{...point,time:Math.max(peak,end-.12)},to])};
 });
 if(!touched)throw Error('Não há vídeo nesse intervalo para aplicar enquadramento.');
 return {...p,clips};
}
function addEditorialText(p:ReelProject,body:string,start:number,end:number,name:string){
 if(!body.trim())throw Error('A sugestão não trouxe um texto válido.');
 return {...p,overlays:[...p.overlays,{id:id(),kind:'text' as const,name,text:body,start,end,track:3,x:50,y:32,scale:.65,rotation:0,opacity:1,color:p.accent,fontA:p.fontA,fontWeight:800}]};
}
export function applyRhythmSuggestion(p:ReelProject,suggestionId:string):ReelProject{
 const analysis=p.editorial,s=analysis?.suggestions.find(s=>s.id===suggestionId);
 if(!analysis||!s)throw Error('Sugestão não encontrada.');
 if(analysis.signature!==rhythmSignature(p))throw Error('A timeline mudou. Analise o ritmo novamente antes de aplicar esta sugestão.');
 if(s.status!=='pending')throw Error('Essa sugestão já foi aplicada ou ignorada.');
 let next=copy(p);
 if(s.type==='pause'||s.type==='jump-cut')next=cutRhythmRange(next,s.start,s.end);
 if(s.type==='punch-in'||s.type==='reframe')next=addFraming(next,s);
 if(s.type==='cta'||s.type==='hook')next=addEditorialText(next,s.text||'',s.start,s.end,s.type==='cta'?'CTA editorial':'Gancho editorial');
 // B-roll acceptance is an editorial marker, not fabricated stock footage.
 next.editorial={...(next.editorial||analysis),signature:s.type==='pause'||s.type==='jump-cut'?analysis.signature:rhythmSignature(next),suggestions:(next.editorial||analysis).suggestions.map(item=>item.id===s.id?{...item,status:'applied'}:item)};
 return next;
}
export function dismissRhythmSuggestion(p:ReelProject,suggestionId:string):ReelProject{
 return {...p,editorial:p.editorial?{...p.editorial,suggestions:p.editorial.suggestions.map(s=>s.id===suggestionId?{...s,status:'dismissed'}:s)}:undefined};
}
export function createRhythmVariants(p:ReelProject):ReelProject[]{
 if(!p.editorial||p.editorial.signature!==rhythmSignature(p))throw Error('Analise o ritmo da timeline atual antes de criar versões.');
 if(p.editorial.openings.length!==2)throw Error('A IA não retornou duas aberturas completas. Analise novamente.');
 const groupId=id(),original={...copy(p),rhythmVariant:{groupId,label:'Original' as const,primary:true}};
 return [original,...p.editorial.openings.map(o=>{
  let branch=copy(p);branch.id=id();branch.name=`${p.name} — Abertura ${o.label}`;
  if(o.leadTrim>0)branch=cutRhythmRange(branch,0,o.leadTrim);
  const duration=rhythmDuration(branch),openingEnd=Math.min(o.duration,duration);
  branch=addEditorialText(branch,o.hookText,0,openingEnd,`Abertura ${o.label}`);
  branch=addFraming(branch,{type:'punch-in',start:0,end:openingEnd,zoom:o.zoom});
  branch=addEditorialText(branch,o.ctaText,Math.max(0,duration-3),duration,`CTA ${o.label}`);
  branch.rhythmVariant={groupId,label:o.label,primary:false};
  return branch;
 })];
}

/** Selecting a version also saves the in-memory edits of the outgoing version. */
export function selectRhythmVersion(current:ReelProject,library:ReelProject[],targetId:string){
 const group=current.rhythmVariant?.groupId;
 const target=library.find(p=>p.id===targetId);
 if(!group||target?.rhythmVariant?.groupId!==group)throw Error('A versão escolhida não pertence a esta comparação A/B.');
 const versions=library.map(item=>{
  const value=item.id===current.id?copy(current):item;
  return value.rhythmVariant?.groupId===group?{...value,rhythmVariant:{...value.rhythmVariant,primary:value.id===targetId}}:value;
 });
 return {project:copy(versions.find(p=>p.id===targetId)!),library:versions};
}
