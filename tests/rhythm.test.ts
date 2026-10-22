import test from 'node:test';
import assert from 'node:assert/strict';
import {initialProject,validateProject,replaceTranscript} from '../src/lib/project.ts';
import {normalizeRhythmResponse,rhythmSignature,transcriptOf,cutRhythmRange,applyRhythmSuggestion,dismissRhythmSuggestion,createRhythmVariants,selectRhythmVersion,type RhythmAudio,type RhythmType} from '../src/lib/rhythm.ts';

const objective='Ensinar e incentivar a salvar o vídeo';
const unavailable:RhythmAudio={checked:false,silences:[],note:'Áudio não medido'};
function sample(){
 return validateProject({...structuredClone(initialProject),id:'original',name:'Meu Reel',videoDuration:10,clips:[{id:'video',src:'/media/example.mp4',start:0,end:10,sourceStart:0,speed:1,zoom:1}],cues:[{id:'fixed',source:'manual',start:2.2,end:3.8,text:'[#01] título fixo',x:45,y:74,preset:'marker'},{id:'speech-1',source:'transcript',start:0,end:3,text:'Um [gancho] direto',y:55},{id:'speech-2',source:'transcript',start:4,end:7,text:'Uma explicação útil',y:55}],overlays:[{id:'logo',kind:'text',name:'Logo',text:'MARCA',start:0,end:10,track:3,x:50,y:10,scale:1,rotation:0,opacity:1}]});
}
function response(){return {hook:{score:35,summary:'A promessa demora',issues:['Comece com o benefício']},segments:[{start:0,end:3,score:35,reason:'Gancho pouco específico'},{start:3,end:10,score:75,reason:'Explicação direta'}],suggestions:[{type:'pause',start:2,end:4,title:'Remover pausa',reason:'Intervalo sugerido para revisão'},{type:'punch-in',start:4,end:6,title:'Acentuar benefício',reason:'Ênfase visual',zoom:1.18},{type:'cta',start:7,end:10,title:'Convidar a salvar',reason:'Objetivo do Reel',text:'Salve para praticar depois'},{type:'broll',start:4,end:5,title:'Mostrar a ferramenta',reason:'Apoiar a explicação'},{type:'hook',start:0,end:3,title:'Mostrar promessa',reason:'Benefício imediato',text:'Aprenda em 30 segundos'},{type:'reframe',start:5,end:7,title:'Mudar enquadramento',reason:'Evitar monotonia',x:55,y:45,zoom:1.12}],openings:[{hookText:'Uma estratégia em 30 segundos',ctaText:'Salve para testar',reason:'Benefício direto',duration:4,zoom:1.1,leadTrim:0},{hookText:'Você já tentou esta estratégia?',ctaText:'Comente sua dúvida',reason:'Pergunta objetiva',duration:5,zoom:1.2,leadTrim:0}]};}
function analyzed(){const p=sample();p.editorial=normalizeRhythmResponse(response(),p,objective,'gemini-test',unavailable);return p;}
const suggestion=(p:ReturnType<typeof sample>,type:RhythmType)=>p.editorial!.suggestions.find(s=>s.type===type)!.id;

test('rhythm analysis reads only speech captions and never changes authored text',()=>{
 const p=sample(),before=structuredClone(p);const analysis=normalizeRhythmResponse(response(),p,objective,'gemini-test',unavailable);
 assert.equal(transcriptOf(p).length,2);assert.ok(transcriptOf(p).every(c=>c.id!=='fixed'));
 assert.equal(analysis.signature,rhythmSignature(p));assert.equal(analysis.hook.score,35);assert.equal(analysis.openings.length,2);
 assert.deepEqual(p,before);
});
test('invalid or out of bounds AI actions are rejected or normalized',()=>{
 const p=sample(),raw=response();raw.hook.score=1000;raw.suggestions.push({type:'delete-project' as any,start:0,end:10,title:'Bad',reason:'Bad'});
 raw.segments[0].start=-9;raw.segments[1].end=99;
 const analysis=normalizeRhythmResponse(raw,p,objective,'gemini-test',unavailable);
 assert.equal(analysis.hook.score,100);assert.equal(analysis.suggestions.length,6);assert.equal(analysis.segments[0].start,0);assert.equal(analysis.segments[1].end,10);
 assert.throws(()=>normalizeRhythmResponse({},p,objective,'gemini-test',unavailable));
});
test('A/B opening trim requires confirmed leading silence',()=>{
 const p=sample(),raw=response();raw.openings[0].leadTrim=1.5;
 assert.equal(normalizeRhythmResponse(raw,p,objective,'gemini-test',unavailable).openings[0].leadTrim,0);
 const measured:RhythmAudio={checked:true,silences:[{start:0,end:.8}],note:'Medido'};
 assert.ok(Math.abs(normalizeRhythmResponse(raw,p,objective,'gemini-test',measured).openings[0].leadTrim-.72)<.001);
 measured.silences=[{start:1,end:2}];assert.equal(normalizeRhythmResponse(raw,p,objective,'gemini-test',measured).openings[0].leadTrim,0);
});
test('accepted cuts preserve authored text and logo, remap clips, and leave input unchanged',()=>{
 const p=analyzed(),before=structuredClone(p);const next=applyRhythmSuggestion(p,suggestion(p,'pause'));
 assert.deepEqual(p,before);assert.equal(next.videoDuration,8);assert.equal(next.clips.length,2);
 assert.equal(next.clips[1].start,2);assert.equal(next.clips[1].sourceStart,4);
 const fixed=next.cues.find(c=>c.id==='fixed')!;assert.equal(fixed.text,'[#01] título fixo');assert.equal(fixed.y,74);assert.equal(fixed.preset,'marker');assert.ok(fixed.end>fixed.start);
 assert.equal(next.overlays[0].id,'logo');assert.equal(next.overlays[0].text,'MARCA');assert.equal(next.overlays[0].end,8);
 assert.equal(next.cues.find(c=>c.id==='speech-2')!.start,2);
 assert.notEqual(next.editorial!.signature,rhythmSignature(next));assert.equal(next.editorial!.suggestions.find(s=>s.id===suggestion(p,'pause'))!.status,'applied');
 assert.throws(()=>applyRhythmSuggestion(next,suggestion(next,'cta')),/timeline mudou/);
});
test('cuts honor source speed and preserve word alignment',()=>{
 const p=sample();p.clips[0].speed=2;
 p.cues=[{id:'word-cue',source:'transcript',start:0,end:7,text:'antes corte depois',words:[{id:'a',text:'antes',start:0,end:1},{id:'b',text:'corte',start:2,end:3},{id:'c',text:'depois',start:5,end:7}]}];
 const next=cutRhythmRange(p,2,4);
 assert.equal(next.clips[1].sourceStart,8);
 assert.equal(next.cues.length,2);assert.equal(next.cues[1].words![0].start,3);assert.equal(next.cues[1].words![0].end,5);assert.equal(next.cues[1].text,'depois');
 assert.throws(()=>cutRhythmRange(p,0,10));
});
test('punch in and reframe affect only video keyframes',()=>{
 const p=analyzed(),before=structuredClone(p);
 const zoomed=applyRhythmSuggestion(p,suggestion(p,'punch-in'));
 assert.deepEqual(zoomed.cues,p.cues);assert.deepEqual(zoomed.overlays,p.overlays);
 assert.ok(zoomed.clips[0].keyframes?.some(k=>k.scale===1.18));assert.deepEqual(p,before);
 const framed=applyRhythmSuggestion(p,suggestion(p,'reframe'));
 assert.ok(framed.clips[0].keyframes?.some(k=>k.x===55&&k.y===45));
});
test('CTA and B-roll are independent of caption and authored text tracks',()=>{
 const p=analyzed(),cta=applyRhythmSuggestion(p,suggestion(p,'cta'));
 assert.deepEqual(cta.cues,p.cues);assert.equal(cta.overlays.length,2);assert.equal(cta.overlays[1].kind,'text');assert.equal(cta.overlays[1].start,7);
 const broll=applyRhythmSuggestion(p,suggestion(p,'broll'));
 assert.deepEqual(broll.clips,p.clips);assert.deepEqual(broll.overlays,p.overlays);assert.equal(broll.editorial!.suggestions.find(s=>s.type==='broll')!.status,'applied');
});

test('CTA final is always placed in the last three seconds even if AI suggests an earlier time',()=>{
 const p=sample(),raw=response();raw.suggestions.find(s=>s.type==='cta')!.start=1;raw.suggestions.find(s=>s.type==='cta')!.end=2;
 const analysis=normalizeRhythmResponse(raw,p,objective,'gemini-test',unavailable),cta=analysis.suggestions.find(s=>s.type==='cta')!;
 assert.equal(cta.start,7);assert.equal(cta.end,10);
});
test('edits invalidate stale analysis and repeated apply cannot duplicate content',()=>{
 const p=analyzed(),ctaId=suggestion(p,'cta');p.cues.find(c=>c.id==='speech-1')!.start=.5;
 assert.throws(()=>applyRhythmSuggestion(p,ctaId),/timeline mudou/);
 const current=analyzed(),applied=applyRhythmSuggestion(current,suggestion(current,'cta'));
 assert.throws(()=>applyRhythmSuggestion(applied,suggestion(current,'cta')),/já foi aplicada/);
});
test('ignoring a suggestion changes only its review status',()=>{
 const p=analyzed(),next=dismissRhythmSuggestion(p,suggestion(p,'hook'));
 assert.deepEqual(next.cues,p.cues);assert.deepEqual(next.clips,p.clips);assert.deepEqual(next.overlays,p.overlays);
 assert.equal(next.editorial!.suggestions.find(s=>s.type==='hook')!.status,'dismissed');assert.equal(p.editorial!.suggestions.find(s=>s.type==='hook')!.status,'pending');
});
test('A/B creates independent full projects with different openings and CTAs',()=>{
 const p=analyzed(),before=structuredClone(p),versions=createRhythmVariants(p);
 assert.deepEqual(p,before);assert.equal(versions.length,3);assert.equal(new Set(versions.map(v=>v.id)).size,3);
 assert.deepEqual(versions[0].cues,p.cues);assert.deepEqual(versions[0].overlays,p.overlays);
 for(const branch of versions.slice(1)){assert.deepEqual(branch.cues,p.cues);assert.equal(branch.clips[0].src,p.clips[0].src);assert.equal(branch.videoDuration,10);assert.equal(branch.overlays.length,p.overlays.length+2);}
 assert.notEqual(versions[1].overlays[1].text,versions[2].overlays[1].text);assert.notDeepEqual(versions[1].clips[0].keyframes,versions[2].clips[0].keyframes);
 versions[1].cues[0].text='Editado em A';assert.equal(versions[0].cues[0].text,before.cues[0].text);assert.equal(versions[2].cues[0].text,before.cues[0].text);
 const restored=validateProject(JSON.parse(JSON.stringify(versions[2])));assert.equal(restored.rhythmVariant!.label,'B');assert.equal(restored.editorial!.openings.length,2);
});
test('regenerating speech after analysis keeps authored titles and makes the analysis stale',()=>{
 const p=analyzed();const next=replaceTranscript(p,[{id:'new',start:0,end:2,text:'Outra fala'}]);
 assert.equal(next.cues.find(c=>c.id==='fixed')!.text,'[#01] título fixo');assert.notEqual(next.editorial!.signature,rhythmSignature(next));
});

test('switching A/B saves outgoing edits and keeps exactly one primary version',()=>{
 const versions=createRhythmVariants(analyzed());
 const first=selectRhythmVersion(versions[0],versions,versions[1].id);
 first.project.cues.find(c=>c.id==='fixed')!.text='Título editado somente em A';
 const second=selectRhythmVersion(first.project,first.library,versions[2].id);
 assert.equal(second.project.rhythmVariant!.label,'B');assert.equal(second.library.filter(v=>v.rhythmVariant!.primary).length,1);
 assert.equal(second.project.cues.find(c=>c.id==='fixed')!.text,'[#01] título fixo');
 const back=selectRhythmVersion(second.project,second.library,versions[1].id);
 assert.equal(back.project.cues.find(c=>c.id==='fixed')!.text,'Título editado somente em A');
 assert.equal(back.library.filter(v=>v.rhythmVariant!.primary)[0].id,back.project.id);
 assert.equal(versions[1].cues.find(c=>c.id==='fixed')!.text,'[#01] título fixo');
 assert.throws(()=>selectRhythmVersion(back.project,back.library,'missing'));
});
