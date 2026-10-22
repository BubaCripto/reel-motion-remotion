import type {Cue,Keyframe,Overlay,ReelProject,VideoClip} from './project';

export const TEMPLATE_ROLES=['title','cta','color','font','logo','main-video','broll','duration'] as const;
export type TemplateRole=typeof TEMPLATE_ROLES[number];
export type FieldType='text'|'color'|'font'|'image'|'video'|'media'|'duration';
export type FieldValue=string|number;
export type TemplateValues=Record<string,FieldValue>;
type Property='text'|'accent'|'foreground'|'background'|'color'|'fontA'|'fontB'|'src'|'duration';
export type TemplateBinding={kind:'project'|'cue'|'overlay'|'clip';id?:string;property:Property};
export type TemplateField={id:string;key:string;label:string;role:TemplateRole;type:FieldType;required:boolean;defaultValue:FieldValue;bindings:TemplateBinding[]};
export type ProjectTemplate={schema:'reel-motion-template';version:1;id:string;name:string;createdAt:string;updatedAt:string;project:ReelProject;fields:TemplateField[]};
export type TemplateAsset={id:string;name:string;alias:string;src:string;kind:'image'|'video'|'font';duration?:number;family?:string};
export type TemplateOrigin={templateId:string;templateName:string;values:TemplateValues;generatedAt:string;requiresTranscription:boolean};
export type TemplateJob={id:string;templateId:string;templateName:string;name:string;row:number;values:TemplateValues;createdAt:string;status:'ready'|'rendering'|'done'|'error'|'invalid';project?:ReelProject;error?:string;url?:string;warnings:string[]};
export type TemplateTarget={key:string;label:string;defaultValue:FieldValue;bindings:TemplateBinding[]};
export const TEMPLATE_LABELS:Record<TemplateRole,string>={title:'Título',cta:'CTA',color:'Cor',font:'Fonte',logo:'Logo','main-video':'Vídeo principal',broll:'B-roll',duration:'Duração de bloco'};
export const MAX_TEMPLATE_BATCH=200;
const id=()=>crypto.randomUUID();
const copy=<T,>(v:T):T=>structuredClone(v);
const unsafe=new Set(['__proto__','constructor','prototype']);
const reserved=new Set(['name','nome','campaign','campanha','client','cliente','product','produto']);
const typeFor:Record<TemplateRole,FieldType>={title:'text',cta:'text',color:'color',font:'font',logo:'image','main-video':'video',broll:'media',duration:'duration'};
const bindingKey=(b:TemplateBinding)=>`${b.kind}:${b.id||''}:${b.property}`;
const span=(p:ReelProject)=>Math.max(1,p.videoDuration||0,...p.clips.map(c=>c.end),...p.cues.map(c=>c.end),...p.overlays.map(c=>c.end));
const short=(text:string)=>text.replace(/[\[\]]/g,'').slice(0,52);
export const templateDefaults=(template:ProjectTemplate):TemplateValues=>Object.fromEntries(template.fields.map(f=>[f.key,f.defaultValue]));
export function createProjectTemplate(project:ReelProject,name:string):ProjectTemplate{
 if(!name.trim())throw Error('Dê um nome ao template.');
 const blueprint=copy(project);
 if(!blueprint.clips.length&&blueprint.videoSrc){blueprint.clips=[{id:id(),src:blueprint.videoSrc,start:0,end:span(blueprint),sourceStart:0,speed:1}];blueprint.videoSrc='';}
 return {schema:'reel-motion-template',version:1,id:id(),name:name.trim().slice(0,120),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),project:blueprint,fields:[]};
}
const findTarget=(p:ReelProject,b:TemplateBinding):any=>b.kind==='project'?p:b.kind==='cue'?p.cues.find(c=>c.id===b.id):b.kind==='clip'?p.clips.find(c=>c.id===b.id):p.overlays.find(c=>c.id===b.id);
function checkBinding(p:ReelProject,b:TemplateBinding,role:TemplateRole){
 const target=findTarget(p,b);
 if(!target)throw Error('Um campo aponta para um elemento que não existe no template.');
 let allowed=false;
 if(role==='title'||role==='cta')allowed=b.property==='text'&&(b.kind==='cue'&&target.source!=='transcript'||b.kind==='overlay'&&target.kind==='text');
 if(role==='color')allowed=b.kind==='project'?['accent','foreground','background'].includes(b.property):b.kind==='cue'?['accent','foreground'].includes(b.property):b.kind==='overlay'&&b.property==='color';
 if(role==='font')allowed=(b.kind==='project'||b.kind==='cue')&&['fontA','fontB'].includes(b.property)||b.kind==='overlay'&&target.kind==='text'&&b.property==='fontA';
 if(role==='logo')allowed=b.kind==='overlay'&&target.kind==='image'&&b.property==='src';
 if(role==='main-video')allowed=b.kind==='clip'&&b.property==='src';
 if(role==='broll')allowed=b.kind==='overlay'&&['image','video'].includes(target.kind)&&b.property==='src';
 if(role==='duration')allowed=b.property==='duration'&&(b.kind==='clip'||b.kind==='overlay'||b.kind==='cue'&&target.source!=='transcript');
 if(!allowed)throw Error('O alvo do campo não é compatível com '+TEMPLATE_LABELS[role]+'. Legendas geradas não podem ser usadas como título ou CTA.');
}
export function validateProjectTemplate(value:unknown):ProjectTemplate{
 const t=value as ProjectTemplate,p=t?.project;
 if(t?.schema!=='reel-motion-template'||t.version!==1||typeof t.id!=='string'||!t.id||typeof t.name!=='string'||!t.name.trim()||!p||!Array.isArray(p.cues)||!Array.isArray(p.clips)||!Array.isArray(p.overlays)||!Array.isArray(p.fonts)||!Array.isArray(t.fields))throw Error('Arquivo de template inválido.');
 if(!Number.isFinite(p.fps)||p.fps<1||!Number.isFinite(p.width)||p.width<100||!Number.isFinite(p.height)||p.height<100||t.fields.length>100)throw Error('Dimensões, FPS ou quantidade de campos inválidos.');
 for(const list of [p.cues,p.clips,p.overlays]){
  if(list.length>10000||new Set(list.map(item=>item?.id)).size!==list.length)throw Error('O template contém blocos repetidos ou em excesso.');
  for(const item of list)if(!item||typeof item.id!=='string'||!item.id||!Number.isFinite(item.start)||!Number.isFinite(item.end)||item.start<0||item.end<=item.start)throw Error('O template contém um bloco com tempo inválido.');
 }
 if(p.cues.some(c=>typeof c.text!=='string')||p.clips.some(c=>typeof c.src!=='string'||!Number.isFinite(c.sourceStart)||c.sourceStart<0||!Number.isFinite(c.speed)||c.speed<=0))throw Error('O template contém texto ou vídeo inválido.');
 const keys=new Set<string>(),targets=new Set<string>(),fieldIds=new Set<string>();
 for(const f of t.fields){
  if(!TEMPLATE_ROLES.includes(f.role)||f.type!==typeFor[f.role]||typeof f.key!=='string'||!/^[a-z][a-z0-9_]*$/.test(f.key)||unsafe.has(f.key)||reserved.has(f.key)||keys.has(f.key))throw Error('Chave de variável inválida ou repetida: '+String(f.key));
  if(typeof f.id!=='string'||fieldIds.has(f.id)||typeof f.label!=='string'||!f.label.trim()||!Array.isArray(f.bindings)||!f.bindings.length||f.bindings.length>10000||!['string','number'].includes(typeof f.defaultValue))throw Error('Definição de campo inválida.');
  keys.add(f.key);fieldIds.add(f.id);
  for(const b of f.bindings){if(!b||!['project','cue','overlay','clip'].includes(b.kind))throw Error('Vínculo de variável inválido.');checkBinding(p,b,f.role);const key=bindingKey(b);if(targets.has(key))throw Error('Dois campos alteram o mesmo alvo. Remova o vínculo duplicado.');targets.add(key);}
 }
 return copy(t);
}
export function templateTargets(p:ReelProject,role:TemplateRole):TemplateTarget[]{
 const targets:TemplateTarget[]=[];
 const add=(key:string,label:string,defaultValue:FieldValue,bindings:TemplateBinding[])=>targets.push({key,label,defaultValue,bindings});
 if(role==='title'||role==='cta'){
  for(const c of p.cues.filter(c=>c.source!=='transcript'))add('cue:'+c.id,`Texto · ${short(c.text)}`,c.text,[{kind:'cue',id:c.id,property:'text'}]);
  for(const o of p.overlays.filter(o=>o.kind==='text'))add('overlay:'+o.id,`Camada · ${o.name}`,o.text||'',[{kind:'overlay',id:o.id,property:'text'}]);
 }
 if(role==='color'||role==='font'){
  const properties=role==='color'?['accent','foreground','background'] as const:['fontA','fontB'] as const;
  const labels:Record<string,string>={accent:'Cor de destaque',foreground:'Cor do texto',background:'Cor de fundo',fontA:'Fonte principal',fontB:'Fonte secundária'};
  for(const property of properties){
   const original=p[property],bindings:TemplateBinding[]=[{kind:'project',property}];
   if(property!=='background'){
    for(const c of p.cues)if(c[property]===original)bindings.push({kind:'cue',id:c.id,property});
    for(const o of p.overlays)if(property==='accent'&&o.color===original||property==='foreground'&&o.kind==='text'&&o.color===original)bindings.push({kind:'overlay',id:o.id,property:'color'});else if(property==='fontA'&&o.kind==='text'&&o.fontA===original)bindings.push({kind:'overlay',id:o.id,property:'fontA'});
   }
   add('project:'+property,labels[property]+' · identidade e valores iguais',original,bindings);
  }
  for(const c of p.cues.filter(c=>c.source!=='transcript'))for(const property of role==='color'?['accent','foreground'] as const:['fontA','fontB'] as const)add(`cue:${c.id}:${property}`,`${short(c.text)} · ${property}`,c[property]??p[property],[{kind:'cue',id:c.id,property}]);
  for(const o of p.overlays.filter(o=>role==='color'||o.kind==='text')){const property=role==='color'?'color':'fontA';add(`overlay:${o.id}:${property}`,`${o.name} · ${TEMPLATE_LABELS[role]}`,o[property]??(role==='color'?p.accent:p.fontA),[{kind:'overlay',id:o.id,property}]);}
 }
 if(role==='main-video')for(const src of new Set(p.clips.map(c=>c.src))){const clips=p.clips.filter(c=>c.src===src);add('video:'+src,`Vídeo · ${src.split('/').pop()} · ${clips.length} trecho(s)`,src,clips.map(c=>({kind:'clip',id:c.id,property:'src'})));}
 if(role==='logo'||role==='broll')for(const o of p.overlays.filter(o=>role==='logo'?o.kind==='image':o.kind==='image'||o.kind==='video'))add('media:'+o.id,o.name,o.src||'',[{kind:'overlay',id:o.id,property:'src'}]);
 if(role==='duration'){
  for(const c of p.clips)add('duration:clip:'+c.id,`Vídeo · ${c.start.toFixed(2)}–${c.end.toFixed(2)} s`,c.end-c.start,[{kind:'clip',id:c.id,property:'duration'}]);
  for(const c of p.cues.filter(c=>c.source!=='transcript'))add('duration:cue:'+c.id,`Texto · ${short(c.text)}`,c.end-c.start,[{kind:'cue',id:c.id,property:'duration'}]);
  for(const o of p.overlays)add('duration:overlay:'+o.id,`Camada · ${o.name}`,o.end-o.start,[{kind:'overlay',id:o.id,property:'duration'}]);
 }
 return targets;
}
export function newTemplateField(t:ProjectTemplate,role:TemplateRole,targetKey:string,key:string,label:string):TemplateField{
 const target=templateTargets(t.project,role).find(option=>option.key===targetKey);if(!target)throw Error('Escolha o elemento que este campo vai substituir.');
 const field:TemplateField={id:id(),key,label:label.trim()||TEMPLATE_LABELS[role],role,type:typeFor[role],required:true,defaultValue:target.defaultValue,bindings:copy(target.bindings)};
 validateProjectTemplate({...t,fields:[...t.fields,field]});return field;
}
export function addTemplateMediaSlot(t:ProjectTemplate,role:'logo'|'broll',cursor=0):ProjectTemplate{
 const next=copy(t),duration=span(next.project),start=role==='logo'?0:Math.min(Math.max(0,cursor),Math.max(0,duration-1/next.project.fps));
 const slot:Overlay={id:id(),kind:'image',name:role==='logo'?'Logo do template':'B-roll do template',src:'',mediaRole:role,frameWidth:role==='broll'?100:50,...(role==='broll'?{frameHeight:100}:{}),start,end:role==='logo'?duration:Math.min(duration,start+3),track:role==='logo'?5:2,x:role==='logo'?85:50,y:role==='logo'?12:50,scale:role==='logo'?.25:1,rotation:0,opacity:1};
 next.project.overlays.push(slot);next.updatedAt=new Date().toISOString();return next;
}
function resolveAsset(value:string,assets:TemplateAsset[],kind:'image'|'video'|'media'){
 if(!value)return undefined;
 let found=assets.filter(a=>a.src===value||a.alias.toLowerCase()===value.toLowerCase());
 if(!found.length&&/[\\/]/.test(value)&&!value.startsWith('/media/')){const basename=value.split(/[\\/]/).pop()!.toLowerCase();found=assets.filter(a=>a.name.toLowerCase()===basename);}
 if(found.length>1)throw Error('Nome de arquivo ambíguo: '+value+'. Use o alias mostrado em Arquivos.');
 const asset=found[0];
 const src=asset?.src||value;
 if(!/^\/media\/[a-z0-9-]+\.[a-z0-9]+$/i.test(src)&&src!=='/demo-grid.svg')throw Error('Envie o arquivo '+value+' em Arquivos do template antes de gerar.');
 const detected=asset?.kind||(/\.(mp4|mov|webm|m4v)$/i.test(src)?'video':/\.(png|jpg|jpeg|svg|webp)$/i.test(src)?'image':undefined);
 if(!detected||detected==='font'||kind!=='media'&&detected!==kind)throw Error('Tipo de mídia incompatível: '+value);
 return asset||{id:src,name:src.split('/').pop()!,alias:src,src,kind:detected};
}
/** Stretch selected video blocks and keep all tracks, words and keyframes aligned. */
function retimeVideoBlocks(p:ReelProject,changes:Map<string,number>,replacedVideos:Set<string>,replacedMedia:Set<string>):ReelProject{
 const blocks=p.clips.filter(c=>changes.has(c.id)).map(c=>({start:c.start,end:c.end,duration:changes.get(c.id)!})).sort((a,b)=>a.start-b.start);
 if(!blocks.length)return p;
 for(let i=1;i<blocks.length;i++)if(blocks[i].start<blocks[i-1].end-.000001)throw Error('Blocos de vídeo com durações variáveis não podem se sobrepor.');
 const map=(time:number)=>{let delta=0;for(const block of blocks){if(time<block.start)return time+delta;if(time<=block.end)return block.start+delta+(time-block.start)*block.duration/(block.end-block.start);delta+=block.duration-(block.end-block.start);}return time+delta;};
 const keys=(list:Keyframe[]|undefined)=>list?.map(k=>({...k,time:map(k.time)}));
 return {...p,videoDuration:map(p.videoDuration||span(p)),clips:p.clips.map(c=>({...c,start:map(c.start),end:map(c.end),speed:replacedVideos.has(c.id)?c.speed:c.speed*(c.end-c.start)/(map(c.end)-map(c.start)),keyframes:keys(c.keyframes)})),cues:p.cues.map(c=>({...c,start:map(c.start),end:map(c.end),words:c.words?.map(w=>({...w,start:map(w.start),end:map(w.end)})),keyframes:keys(c.keyframes)})),overlays:p.overlays.map(o=>({...o,start:map(o.start),end:map(o.end),...(o.kind==='video'?{speed:replacedMedia.has(o.id)?(o.speed??1):(o.speed??1)*(o.end-o.start)/(map(o.end)-map(o.start))}:{}),keyframes:keys(o.keyframes)}))};
}
function setBlockDuration(item:Cue|Overlay,value:number,replaced=false){
 const start=item.start,ratio=value/(item.end-item.start),map=(time:number)=>start+(time-start)*ratio;
 const patch={end:start+value,keyframes:item.keyframes?.map(k=>({...k,time:map(k.time)}))};
 Object.assign(item,patch);
 if('words' in item&&item.words)item.words=item.words.map(w=>({...w,start:map(w.start),end:map(w.end)}));
 if('kind' in item&&item.kind==='video'&&!replaced)item.speed=(item.speed??1)/ratio;
}
export function instantiateTemplate(template:ProjectTemplate,input:Record<string,unknown>,assets:TemplateAsset[]=[],name?:string):{project:ReelProject;warnings:string[];values:TemplateValues}{
 const t=validateProjectTemplate(template),values:TemplateValues=Object.create(null),media=new Map<string,TemplateAsset|undefined>();
 for(const key of Object.keys(input))if(unsafe.has(key)||!reserved.has(key)&&!t.fields.some(f=>f.key===key))throw Error('Coluna ou variável desconhecida: '+key);
 for(const f of t.fields){
  let raw=Object.hasOwn(input,f.key)?input[f.key]:f.defaultValue;
  if(raw===null||raw===undefined)raw='';
  if(typeof raw!=='string'&&typeof raw!=='number')throw Error(f.label+': use texto ou número.');
  let value:FieldValue=typeof raw==='string'?raw.trim():raw;
  if(f.required&&(value===''||typeof value==='number'&&!Number.isFinite(value)))throw Error(f.label+': campo obrigatório.');
  if(f.type==='duration'&&value!==''){value=Number(String(value).replace(',','.'));if(!Number.isFinite(value)||value<1/t.project.fps||value>14400)throw Error(f.label+': duração inválida em segundos.');}
  if(f.type==='color'&&value!==''){value=String(value);if(/^#[a-f0-9]{3}$/i.test(value))value='#'+value.slice(1).split('').map(c=>c+c).join('');if(!/^#[a-f0-9]{6}$/i.test(value))throw Error(f.label+': use cor hexadecimal (#RRGGBB).');}
  if(f.type==='font'&&value!==''&&(String(value).length>100||/[\n\r;{}]/.test(String(value))))throw Error(f.label+': nome de fonte inválido.');
  if(f.type==='text'&&String(value).length>5000)throw Error(f.label+': texto muito longo.');
  if(['image','video','media'].includes(f.type))media.set(f.id,resolveAsset(String(value),assets,f.type as 'image'|'video'|'media'));
  values[f.key]=value;
 }
 let project=copy(t.project);project.id=id();project.name=(name||String(input.nome||input.name||input.campanha||input.campaign||input.cliente||input.client||input.produto||input.product||t.name)).trim().slice(0,160)||t.name;
 delete project.editorial;delete project.rhythmVariant;
 const clipDurations=new Map<string,number>(),otherDurations:{binding:TemplateBinding;value:number}[]=[];
 const replacedVideo=new Set<string>(),replacedMedia=new Set<string>();
 for(const f of t.fields){const value=values[f.key];
  if(f.type==='duration'){if(value!=='')for(const binding of f.bindings)if(binding.kind==='clip')clipDurations.set(binding.id!,Number(value));else otherDurations.push({binding,value:Number(value)});continue;}
  if(value===''&&(f.type==='color'||f.type==='font'||f.type==='video'))continue;
  for(const binding of f.bindings){const target=findTarget(project,binding);
   if(f.type==='image'||f.type==='video'||f.type==='media'){
    const asset=media.get(f.id),src=asset?.src||'';
    if(binding.kind==='clip'&&target.src!==src)replacedVideo.add(target.id);
    if(binding.kind==='overlay'&&target.src!==src)replacedMedia.add(target.id);
    target.src=src;
    if(binding.kind==='overlay'&&f.role==='broll'&&asset){const wasVideo=target.kind==='video';target.frameWidth??=wasVideo?100:50;target.kind=asset.kind;target.mediaRole='broll';if(asset.kind==='video'){target.sourceStart=wasVideo?(target.sourceStart??0):0;target.speed=wasVideo?(target.speed??1):1;target.muted=target.muted??true;}}
   }else{
    target[binding.property]=f.type==='text'?String(value):value;
    if(binding.kind==='cue'&&binding.property==='text')target.words=undefined;
    if(f.type==='font'){const asset=assets.find(a=>a.kind==='font'&&(a.family===value||a.alias===value||a.name===value));if(asset){target[binding.property]=asset.family;project.fonts=[...project.fonts.filter(font=>font.name!==asset.family),{name:asset.family!,src:asset.src}];}}
   }
  }
 }
 project=retimeVideoBlocks(project,clipDurations,replacedVideo,replacedMedia);
 for(const change of otherDurations)setBlockDuration(findTarget(project,change.binding),change.value,replacedMedia.has(change.binding.id!));
 for(const clip of project.clips.filter(c=>replacedVideo.has(c.id))){const asset=assets.find(a=>a.kind==='video'&&a.src===clip.src);if(!asset?.duration||clip.sourceStart+(clip.end-clip.start)*clip.speed>asset.duration+1/project.fps)throw Error('Vídeo '+clip.src.split('/').pop()+': mídia curta ou duração não verificada. Envie o arquivo em Arquivos e confira o trecho usado pelo template.');}
 for(const layer of project.overlays.filter(o=>o.kind==='video'&&replacedMedia.has(o.id))){const asset=assets.find(a=>a.kind==='video'&&a.src===layer.src);if(!asset?.duration||(layer.sourceStart||0)+(layer.end-layer.start)*(layer.speed||1)>asset.duration+1/project.fps)throw Error('B-roll '+layer.name+': o arquivo é mais curto que o bloco ou sua duração não foi verificada.');}
 if(project.clips.some(c=>!Number.isFinite(c.speed)||c.speed<.0625||c.speed>16))throw Error('A duração solicitada exige uma velocidade de vídeo fora do intervalo suportado.');
 if(project.overlays.some(o=>o.kind==='video'&&(!Number.isFinite(o.speed??1)||(o.speed??1)<.0625||(o.speed??1)>16)))throw Error('A duração solicitada exige uma velocidade de B-roll fora do intervalo suportado.');
 project.videoDuration=span(project);
 const requiresTranscription=replacedVideo.size>0&&project.cues.some(c=>c.source==='transcript');
 project.templateOrigin={templateId:t.id,templateName:t.name,values:copy(values),generatedAt:new Date().toISOString(),requiresTranscription};
 return {project,values,warnings:requiresTranscription?['Vídeo principal substituído: as legendas existentes foram mantidas. Revise ou gere a transcrição da nova fala.']:[]};
}

export function parseTemplateRows(raw:string,format:'json'|'csv'):Record<string,unknown>[]{
 const source=raw.replace(/^\uFEFF/,'');let rows:unknown;
 if(format==='json'){const data=JSON.parse(source);rows=Array.isArray(data)?data:data?.versions||data?.versoes||data?.items;}
 else{
  let quoted=false,commas=0,semicolons=0;for(let i=0;i<source.length;i++){const c=source[i];if(c==='"')quoted=!quoted;if(!quoted){if(c==='\n'||c==='\r')break;if(c===',')commas++;if(c===';')semicolons++;}}
  const delimiter=semicolons>commas?';':',';
  const table:string[][]=[];let row:string[]=[],cell='',inQuotes=false,closedQuote=false;
  const pushCell=()=>{row.push(cell);cell='';closedQuote=false;};
  const pushRow=()=>{pushCell();if(row.some(v=>v.trim()))table.push(row);row=[];};
  for(let i=0;i<source.length;i++){const c=source[i];
   if(inQuotes){if(c==='"'&&source[i+1]==='"'){cell+='"';i++;}else if(c==='"'){inQuotes=false;closedQuote=true;}else cell+=c;}
   else if(c==='"'){if(cell.trim()||closedQuote)throw Error('CSV inválido: aspas no meio de um campo.');cell='';inQuotes=true;}
   else if(c===delimiter)pushCell();else if(c==='\n'||c==='\r'){if(c==='\r'&&source[i+1]==='\n')i++;pushRow();}
   else if(closedQuote&&!/\s/.test(c))throw Error('CSV inválido após fechar as aspas.');else if(!closedQuote)cell+=c;
  }
  if(inQuotes)throw Error('CSV inválido: campo com aspas não fechadas.');
  if(cell||row.length)pushRow();
  const headers=table.shift()?.map(h=>h.trim())||[];
  if(!headers.length||headers.some(h=>!h||unsafe.has(h))||new Set(headers).size!==headers.length)throw Error('CSV precisa de cabeçalhos únicos e válidos.');
  rows=table.map((values,index)=>{if(values.length!==headers.length)throw Error(`Linha ${index+2}: quantidade de colunas diferente do cabeçalho.`);return Object.fromEntries(headers.map((h,i)=>[h,values[i]]));});
 }
 if(!Array.isArray(rows)||!rows.length||rows.some(r=>!r||Array.isArray(r)||typeof r!=='object'))throw Error('Importe uma lista de objetos JSON ou um CSV com cabeçalho.');
 if(rows.length>MAX_TEMPLATE_BATCH)throw Error(`Cada lote aceita até ${MAX_TEMPLATE_BATCH} versões. Divida a lista em arquivos menores.`);
 return rows as Record<string,unknown>[];
}
export function templateExample(t:ProjectTemplate,format:'json'|'csv'){
 const row={nome:t.name+' — exemplo',...templateDefaults(t)};
 if(format==='json')return JSON.stringify([row],null,2);
 const escape=(v:unknown)=>'"'+String(v).replace(/"/g,'""')+'"';
 return Object.keys(row).map(escape).join(';')+'\r\n'+Object.values(row).map(escape).join(';')+'\r\n';
}
export function buildTemplateJob(template:ProjectTemplate,row:Record<string,unknown>,assets:TemplateAsset[],index=0):TemplateJob{
 const name=String(row.nome||row.name||row.campanha||row.campaign||row.cliente||row.client||row.produto||row.product||`${template.name} — ${index+1}`).slice(0,160);
 const job:TemplateJob={id:id(),templateId:template.id,templateName:template.name,name,row:index+1,values:Object.fromEntries(Object.entries(row).filter(([,v])=>typeof v==='string'||typeof v==='number')) as TemplateValues,createdAt:new Date().toISOString(),status:'invalid',warnings:[]};
 try{const result=instantiateTemplate(template,row,assets,name);return {...job,project:result.project,values:result.values,warnings:result.warnings,status:'ready'};}catch(error){return {...job,error:error instanceof Error?error.message:String(error)};}
}
