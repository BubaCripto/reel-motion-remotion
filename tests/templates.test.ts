import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialProject,validateProject,replaceTranscript,parseSrt,clone,type ReelProject} from '../src/lib/project.ts';
import {createProjectTemplate,newTemplateField,templateTargets,validateProjectTemplate,instantiateTemplate,addTemplateMediaSlot,parseTemplateRows,templateExample,buildTemplateJob,type ProjectTemplate,type TemplateAsset,type TemplateRole} from '../src/lib/templates.ts';

function project():ReelProject{return {...clone(initialProject),name:'Campanha',videoDuration:10,videoSrc:'',clips:[{id:'clip1',src:'/media/original.mp4',start:0,end:5,sourceStart:1,speed:1},{id:'clip2',src:'/media/original.mp4',start:5,end:10,sourceStart:8,speed:1}],cues:[{id:'title',source:'manual',text:'Título antigo',start:0,end:2,fontA:'Anton',accent:'#e8bd55',keyframes:[{time:1,x:40}]},{id:'cta',text:'Comente agora',start:8,end:10},{id:'speech',source:'transcript',text:'Fala original',start:1,end:3,words:[{id:'w1',text:'Fala',start:1,end:2},{id:'w2',text:'original',start:2,end:3}]}],overlays:[{id:'logo',name:'Marca',kind:'image',src:'/demo-grid.svg',start:0,end:10,track:3,x:80,y:15,scale:.3,opacity:1,rotation:0},{id:'broll',name:'Produto',kind:'image',src:'/demo-grid.svg',start:6,end:8,track:3,x:50,y:50,scale:1,opacity:1,rotation:0}]};}
function field(t:ProjectTemplate,role:TemplateRole,target:string,key:string){return {...t,fields:[...t.fields,newTemplateField(t,role,target,key,key)]};}
const video:TemplateAsset={id:'asset',name:'produto.mp4',alias:'produto.mp4',src:'/media/replacement.mp4',kind:'video',duration:30};

test('template capture and each generated version are deep independent copies',()=>{
 const p=project(),snapshot=clone(p);let t=createProjectTemplate(p,'Modelo');t=field(t,'title','cue:title','titulo');const a=instantiateTemplate(t,{titulo:'Produto A'}).project,b=instantiateTemplate(t,{titulo:'Produto B'}).project;
 assert.equal(a.cues[0].text,'Produto A');assert.equal(b.cues[0].text,'Produto B');assert.notEqual(a.id,b.id);a.cues[0].keyframes![0].x=99;assert.equal(t.project.cues[0].keyframes![0].x,40);assert.deepEqual(p,snapshot);assert.deepEqual(t.project,snapshot);
});
test('legacy real project texts survive capture, template filling and new transcription',()=>{
 const p=validateProject(JSON.parse(readFileSync(new URL('./fixtures/30-dias-legacy.json',import.meta.url),'utf8'))),old=clone(p.cues);const t=createProjectTemplate(p,'30 dias');assert.equal(old.length,4);assert.equal(templateTargets(t.project,'title').length,old.length+t.project.overlays.filter(o=>o.kind==='text').length);
 const generated=instantiateTemplate(t,{}).project;const next=replaceTranscript(generated,parseSrt('1\n00:00:01,000 --> 00:00:02,000\nNova fala'));assert.deepEqual(next.cues.filter(c=>c.source!=='transcript'),old);assert.equal(next.cues.filter(c=>c.source==='transcript').length,1);
});
test('title and CTA target only manual text and cannot replace transcript',()=>{
 let t=createProjectTemplate(project(),'Modelo');assert.ok(!templateTargets(t.project,'title').some(v=>v.key==='cue:speech'));t=field(t,'title','cue:title','titulo');t=field(t,'cta','cue:cta','cta');const result=instantiateTemplate(t,{titulo:'Novo [TÍTULO]',cta:'Salve agora'}).project;assert.equal(result.cues[0].text,'Novo [TÍTULO]');assert.equal(result.cues[1].text,'Salve agora');assert.deepEqual(result.cues[2],t.project.cues[2]);
 const bad=clone(t);bad.fields[0].bindings=[{kind:'cue',id:'speech',property:'text'}];assert.throws(()=>validateProjectTemplate(bad),/Legendas/);
});
test('identity field changes linked explicit values and keeps custom style overrides',()=>{
 const p=project();p.cues[1].accent='#ff0000';p.cues[1].fontA='Caveat';let t=createProjectTemplate(p,'Marca');t=field(t,'color','project:accent','cor');t=field(t,'font','project:fontA','fonte');const result=instantiateTemplate(t,{cor:'#09f',fonte:'Inter'}).project;assert.equal(result.accent,'#0099ff');assert.equal(result.cues[0].accent,'#0099ff');assert.equal(result.cues[1].accent,'#ff0000');assert.equal(result.cues[0].fontA,'Inter');assert.equal(result.cues[1].fontA,'Caveat');assert.equal(result.cues[2].source,'transcript');
});
test('uploaded font family is registered on generated project only',()=>{
 let t=createProjectTemplate(project(),'Fontes');t=field(t,'font','project:fontA','fonte');const result=instantiateTemplate(t,{fonte:'marca.ttf'},[{id:'font',name:'marca.ttf',alias:'marca.ttf',family:'Marca',kind:'font',src:'/media/custom.ttf'}]).project;assert.equal(result.fontA,'Marca');assert.deepEqual(result.fonts,[{name:'Marca',src:'/media/custom.ttf'}]);assert.equal(t.project.fonts.length,0);
});
test('logo and B-roll media substitute specific layers and add video behind text',()=>{
 let t=createProjectTemplate(project(),'Mídias');t=field(t,'logo','media:logo','logo');t=field(t,'broll','media:broll','broll');const logo:TemplateAsset={id:'logo',name:'marca.png',alias:'marca.png',src:'/media/brand.png',kind:'image'};
 const result=instantiateTemplate(t,{logo:'marca.png',broll:'produto.mp4'},[logo,video]).project;assert.equal(result.overlays[0].src,logo.src);assert.equal(result.overlays[1].kind,'video');assert.equal(result.overlays[1].mediaRole,'broll');assert.equal(result.overlays[1].muted,true);assert.equal(result.overlays[1].frameWidth,50);assert.deepEqual(result.cues,t.project.cues);
});
test('new logo and B-roll slots only mutate blueprint and have sensible frame dimensions',()=>{
 const t=createProjectTemplate(project(),'Slots'),snapshot=clone(t);const next=addTemplateMediaSlot(addTemplateMediaSlot(t,'logo'),'broll',4);assert.deepEqual(t,snapshot);assert.equal(next.project.overlays.length,t.project.overlays.length+2);assert.equal(next.project.overlays.at(-1)?.start,4);assert.equal(next.project.overlays.at(-1)?.frameWidth,100);assert.equal(next.project.overlays.at(-1)?.frameHeight,100);
});
test('B-roll template retains source trims, speed and framing when filled or replaced',()=>{
 const p=project();Object.assign(p.overlays[1],{kind:'video',src:'/media/original.mp4',sourceStart:4,speed:2,muted:false,scale:0.8});let t=createProjectTemplate(p,'B-roll cortado');t=field(t,'broll','media:broll','broll');
 const unchanged=instantiateTemplate(t,{}).project.overlays[1];assert.equal(unchanged.sourceStart,4);assert.equal(unchanged.speed,2);assert.equal(unchanged.muted,false);assert.equal(unchanged.scale,0.8);
 const changed=instantiateTemplate(t,{broll:video.alias},[video]).project.overlays[1];assert.equal(changed.sourceStart,4);assert.equal(changed.speed,2);assert.throws(()=>instantiateTemplate(t,{broll:video.alias},[{...video,duration:7}]),/B-roll/);
});
test('template import refuses repeated block identities and stale binding targets',()=>{
 const t=createProjectTemplate(project(),'Inválido'),duplicate=clone(t);duplicate.project.cues.push(clone(duplicate.project.cues[0]));assert.throws(()=>validateProjectTemplate(duplicate),/repetidos/);
 const target=field(t,'title','cue:title','titulo');target.project.cues=target.project.cues.filter(c=>c.id!=='title');assert.throws(()=>validateProjectTemplate(target),/não existe/);
});
test('main video replacement preserves cuts and captions but flags new transcript requirement',()=>{
 let t=createProjectTemplate(project(),'Vídeo');t=field(t,'main-video','video:/media/original.mp4','video');const {project:p,warnings}=instantiateTemplate(t,{video:'produto.mp4'},[video]);assert.deepEqual(p.clips.map(c=>({id:c.id,start:c.start,end:c.end,sourceStart:c.sourceStart})),t.project.clips.map(c=>({id:c.id,start:c.start,end:c.end,sourceStart:c.sourceStart})));assert.ok(p.clips.every(c=>c.src===video.src));assert.deepEqual(p.cues,t.project.cues);assert.equal(p.templateOrigin?.requiresTranscription,true);assert.equal(warnings.length,1);assert.equal(t.project.templateOrigin,undefined);
});
test('media too short or without duration cannot silently generate frozen video tails',()=>{
 let t=createProjectTemplate(project(),'Vídeo');t=field(t,'main-video','video:/media/original.mp4','video');assert.throws(()=>instantiateTemplate(t,{video:'produto.mp4'},[{...video,duration:9}]),/mídia curta/);assert.throws(()=>instantiateTemplate(t,{video:video.src}),/duração não verificada/);assert.throws(()=>instantiateTemplate(t,{video:'https://example.com/video.mp4'}),/Envie o arquivo/);
});
test('video block duration retimes captions, words, keyframes, next blocks and playback',()=>{
 let t=createProjectTemplate(project(),'Tempo');t=field(t,'duration','duration:clip:clip1','duracao');const p=instantiateTemplate(t,{duracao:10}).project;assert.equal(p.clips[0].end,10);assert.equal(p.clips[0].speed,.5);assert.equal(p.clips[1].start,10);assert.equal(p.clips[1].end,15);assert.equal(p.clips[1].speed,1);assert.equal(p.cues[0].end,4);assert.equal(p.cues[0].keyframes![0].time,2);assert.equal(p.cues[2].words![1].end,6);assert.equal(p.overlays[1].start,11);assert.equal(p.videoDuration,15);
});
test('new source plus variable video duration uses original speed and validates required source interval',()=>{
 let t=createProjectTemplate(project(),'Novo vídeo');t=field(t,'main-video','video:/media/original.mp4','video');t=field(t,'duration','duration:clip:clip1','duracao');const p=instantiateTemplate(t,{video:video.alias,duracao:2},[video]).project;assert.equal(p.clips[0].speed,1);assert.equal(p.clips[0].end,2);assert.equal(p.clips[1].start,2);assert.equal(p.clips[1].sourceStart,8);
});
test('manual text block duration scales its keyframes without moving unrelated blocks',()=>{
 let t=createProjectTemplate(project(),'Texto');t=field(t,'duration','duration:cue:title','duracao');const p=instantiateTemplate(t,{duracao:'4,5'}).project;assert.equal(p.cues[0].end,4.5);assert.equal(p.cues[0].keyframes![0].time,2.25);assert.equal(p.cues[1].start,8);assert.deepEqual(p.clips,t.project.clips);
});
test('duplicate keys, duplicate bindings, unknown rows and invalid colors fail explicitly',()=>{
 let t=createProjectTemplate(project(),'Inválidos');t=field(t,'title','cue:title','titulo');assert.throws(()=>field(t,'cta','cue:cta','titulo'),/repetida/);assert.throws(()=>field(t,'cta','cue:title','cta'),/mesmo alvo/);assert.throws(()=>field(t,'cta','cue:cta','constructor'),/inválida/);assert.throws(()=>instantiateTemplate(t,{typo:'oops'}),/desconhecida/);assert.throws(()=>instantiateTemplate(t,{titulo:''}),/obrigatório/);t=field(t,'color','project:accent','cor');assert.throws(()=>instantiateTemplate(t,{cor:'red'}),/hexadecimal/);
});
test('optional empty media can omit placeholder without deleting existing primary video',()=>{
 let t=createProjectTemplate(project(),'Opcional');t=field(t,'main-video','video:/media/original.mp4','video');t.fields[0].required=false;assert.deepEqual(instantiateTemplate(t,{video:''}).project.clips,t.project.clips);
});
test('CSV parser handles BOM, semicolon, escaped quotes, decimal comma and multiline Unicode',()=>{
 const rows=parseTemplateRows('\uFEFFnome;titulo;duracao\r\n"Campanha A";"Oferta; \"\"ótima\"\"\nAgora";"2,5"\r\n','csv');assert.deepEqual(rows,[{nome:'Campanha A',titulo:'Oferta; "ótima"\nAgora',duracao:'2,5'}]);assert.deepEqual(parseTemplateRows('nome,titulo\nA,"Um, dois"','csv'),[{nome:'A',titulo:'Um, dois'}]);
});
test('CSV malformed headers, column counts, unclosed quotes and oversized batches are rejected',()=>{
 for(const csv of ['nome;nome\nA;B','nome;titulo\nA','nome;titulo\nA;"Aberto','__proto__;titulo\nA;B'])assert.throws(()=>parseTemplateRows(csv,'csv'));assert.throws(()=>parseTemplateRows(JSON.stringify(Array.from({length:201},()=>({nome:'A'}))),'json'),/200/);assert.throws(()=>parseTemplateRows('{}','json'));
});
test('JSON and CSV examples round-trip exact field keys and values',()=>{
 let t=createProjectTemplate(project(),'Modelo');t=field(t,'title','cue:title','titulo');for(const format of ['json','csv'] as const){const rows=parseTemplateRows(templateExample(t,format),format);assert.equal(rows[0].titulo,'Título antigo');assert.equal(buildTemplateJob(t,rows[0],[]).status,'ready');}assert.deepEqual(parseTemplateRows('{"versions":[{"nome":"A"}]}','json'),[{nome:'A'}]);
});
test('batch creates valid rows independently and exposes invalid rows without losing content',()=>{
 let t=createProjectTemplate(project(),'Lote');t=field(t,'title','cue:title','titulo');const rows=[{nome:'Cliente A',titulo:'A'},{nome:'Cliente B',titulo:''},{nome:'Cliente C',titulo:'C'}],jobs=rows.map((row,i)=>buildTemplateJob(t,row,[],i));assert.deepEqual(jobs.map(j=>j.status),['ready','invalid','ready']);assert.equal(jobs[1].row,2);assert.match(jobs[1].error!,/obrigatório/);assert.equal(jobs[2].project?.cues[0].text,'C');assert.notEqual(jobs[0].id,jobs[2].id);assert.notEqual(jobs[0].project?.id,jobs[2].project?.id);
});
test('generated projects serialize template provenance and invalidate stale editorial analysis',()=>{
 const p=project();p.rhythmVariant={familyId:'x',label:'A',principal:true} as any;p.editorial={id:'old'} as any;const t=createProjectTemplate(p,'Modelo');const result=JSON.parse(JSON.stringify(instantiateTemplate(t,{}).project));assert.equal(result.editorial,undefined);assert.equal(result.rhythmVariant,undefined);assert.equal(result.templateOrigin.templateId,t.id);assert.equal(t.project.editorial?.id,'old');
});
