import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRate,parseVideoMetadata,prepareRenderFrameRate} from '../server/media-info.mjs';
import {COMMON_FRAME_RATES,formatFps,projectVideoSources,sameFps,setProjectFrameRate} from '../src/lib/frame-rate.ts';
import {clone,initialProject,validateProject} from '../src/lib/project.ts';

const data=(rate='24/1',times=[0,1/24,2/24,3/24,4/24])=>({streams:[{avg_frame_rate:rate,r_frame_rate:rate,width:1920,height:1080,duration:'46',nb_frames:'1104'}],frames:times.map(n=>({best_effort_timestamp_time:String(n)})),format:{duration:'46'}});
test('rational frame rates preserve NTSC fractions instead of rounding to an integer',()=>{
 assert.equal(parseRate('24000/1001'),24000/1001);assert.equal(parseRate('30000/1001'),30000/1001);assert.equal(parseRate('60000/1001'),60000/1001);assert.equal(parseRate('24/1'),24);
 for(const raw of ['0/0','1/0','abc','',null,undefined,{},-1,Infinity,'9999/1'])assert.equal(parseRate(raw),null);
});
test('constant source metadata includes measured FPS, dimensions and known frame count',()=>{
 const info=parseVideoMetadata('/media/clip.mp4',data());assert.equal(info.fps,24);assert.equal(info.recommendedFps,24);assert.equal(info.fpsRatio,'24/1');assert.equal(info.cadence,'constant-sample');assert.equal(info.sampledFrames,5);assert.equal(info.frameCount,1104);assert.equal(info.width,1920);
});
test('29.97 FPS timestamp quantization does not falsely trigger variable frame rate',()=>{
 const times=Array.from({length:240},(_,n)=>Number((n*1001/30000).toFixed(6))),info=parseVideoMetadata('/media/ntsc.mp4',data('30000/1001',times));assert.equal(info.cadence,'constant-sample');assert.equal(info.recommendedFps,30000/1001);assert.equal(formatFps(info.fps),'29,97');
});
test('variable cadence uses nominal FPS for a constant-rate export',()=>{
 const raw=data('2973/100',[0,1/30,2/30,4/30,5/30]);raw.streams[0].r_frame_rate='30/1';const info=parseVideoMetadata('/media/vfr.mp4',raw);assert.equal(info.fps,29.73);assert.equal(info.cadence,'variable');assert.equal(info.recommendedFps,30);
});
test('missing average rate falls back safely and absent timestamps remain unknown',()=>{
 const raw=data('0/0',[]);raw.streams[0].r_frame_rate='25/1';raw.streams[0].nb_frames='N/A';const info=parseVideoMetadata('/media/fallback.mp4',raw);assert.equal(info.fps,25);assert.equal(info.cadence,'unknown');assert.equal(info.frameCount,null);assert.throws(()=>parseVideoMetadata('/media/empty.mp4',{streams:[]}),/faixa de vídeo/);
});
test('an invalid or unusually high nominal rate is not treated as a recording FPS',()=>{
 const raw=data('24/1');raw.streams[0].r_frame_rate='90000/1';const info=parseVideoMetadata('/media/rate.mp4',raw);assert.equal(info.nominalFps,null);assert.equal(info.recommendedFps,24);
});
test('changing the export grid preserves every clip, caption, word and keyframe in seconds',()=>{
 const p=clone(initialProject);p.clips=[{id:'c',src:'/media/source.mp4',start:2.3,end:8.7,sourceStart:.35,speed:1.25,keyframes:[{time:4.2,scale:1.1}]}];p.cues[0].words=[{id:'w',text:'Fala',start:.35,end:.7}];const before=clone(p),next=setProjectFrameRate(p,24000/1001,'source');assert.deepEqual(p,before);assert.equal(next.fps,24000/1001);assert.equal(next.exportFpsMode,'source');assert.strictEqual(next.clips,p.clips);assert.strictEqual(next.cues,p.cues);assert.strictEqual(next.overlays,p.overlays);assert.strictEqual(next.cues[0].words,p.cues[0].words);
});
test('invalid rates cannot be applied to a project',()=>{for(const fps of [NaN,Infinity,0,-24,500])assert.throws(()=>setProjectFrameRate(initialProject,fps,'manual'),/FPS/);});
test('old JSON preserves its manual FPS while new projects start in source mode',()=>{
 const raw=clone(initialProject);delete raw.exportFpsMode;raw.fps=60;const restored=validateProject(raw);assert.equal(restored.fps,60);assert.equal(restored.exportFpsMode,'manual');assert.equal(initialProject.exportFpsMode,'source');assert.equal(validateProject({...raw,exportFpsMode:'source'}).exportFpsMode,'source');
});
test('source listing deduplicates cuts but keeps B-roll and legacy media',()=>{
 const p=clone(initialProject);p.videoSrc='/media/legacy.mp4';p.clips=[];p.overlays=[];assert.equal(projectVideoSources(p)[0].src,p.videoSrc);p.clips=[{id:'a',src:'/media/main.mp4',start:0,end:2,sourceStart:0,speed:1},{id:'b',src:'/media/main.mp4',start:2,end:4,sourceStart:4,speed:1}];p.overlays=[{id:'roll',kind:'video',name:'Produto',src:'/media/roll.mp4',start:0,end:2,track:2,x:50,y:50,scale:1,opacity:1,rotation:0}];assert.deepEqual(projectVideoSources(p).map(s=>s.src),['/media/main.mp4','/media/roll.mp4']);
});
test('automatic export never overrides manual FPS or forces a source on a text-only project',async()=>{
 const p={...clone(initialProject),exportFpsMode:'manual' as const,fps:60};assert.strictEqual(await prepareRenderFrameRate(p,process.cwd()),p);const noVideo={...p,clips:[],videoSrc:'',exportFpsMode:'source' as const};assert.strictEqual(await prepareRenderFrameRate(noVideo,process.cwd()),noVideo);
});
test('source mode rejects arbitrary paths instead of silently exporting with a guessed FPS',async()=>{
 const p={...clone(initialProject),exportFpsMode:'source' as const,clips:[{id:'bad',src:'C:/private/video.mp4',start:0,end:1,sourceStart:0,speed:1}]};await assert.rejects(()=>prepareRenderFrameRate(p,process.cwd()),/Importe a mídia/);
});
test('fractional display and rate comparison distinguish 24 from 23.976 FPS',()=>{
 assert.equal(formatFps(24),'24');assert.equal(formatFps(24000/1001),'23,976');assert.equal(formatFps(null),'não identificado');assert.equal(sameFps(29.97,30000/1001),true);assert.equal(sameFps(24,24000/1001),false);assert.ok(COMMON_FRAME_RATES.includes(60000/1001));
});
