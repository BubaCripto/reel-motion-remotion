import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';

const cache=new Map();
export function parseRate(value){
 if(typeof value!=='string'&&typeof value!=='number')return null;
 const parts=String(value).split('/').map(Number),rate=parts.length===2?parts[0]/parts[1]:parts.length===1?parts[0]:NaN;
 return Number.isFinite(rate)&&rate>0&&rate<=240?rate:null;
}
/** Cadence is sampled, not a promise that the entire recording is constant. */
export function parseVideoMetadata(src,data){
 const stream=data?.streams?.[0];if(!stream)throw Error('O arquivo não contém uma faixa de vídeo.');
 const fps=parseRate(stream.avg_frame_rate)||parseRate(stream.r_frame_rate),nominalFps=parseRate(stream.r_frame_rate);
 const timestamps=(data.frames||[]).map(f=>Number(f.best_effort_timestamp_time)).filter(Number.isFinite),deltas=timestamps.slice(1).map((t,i)=>t-timestamps[i]);
 const sorted=deltas.filter(n=>n>0).sort((a,b)=>a-b),median=sorted[Math.floor(sorted.length/2)];
 const cadence=deltas.length<3?'unknown':deltas.some(n=>n<=0||Math.abs(n-median)>Math.max(.0001,median*.05))?'variable':'constant-sample';
 // VFR cannot be exported as a variable-rate Remotion composition. Prefer its
 // nominal rate when trustworthy, otherwise the measured average rate.
 const recommendedFps=cadence==='variable'&&nominalFps?nominalFps:fps;
 const numeric=(value)=>{const n=Number(value);return Number.isFinite(n)&&n>0?n:null;};
 return {src,fps,fpsRatio:parseRate(stream.avg_frame_rate)?String(stream.avg_frame_rate):String(stream.r_frame_rate||''),nominalFps,nominalRatio:String(stream.r_frame_rate||''),recommendedFps,cadence,sampledFrames:timestamps.length,width:numeric(stream.width),height:numeric(stream.height),duration:numeric(stream.duration)||numeric(data.format?.duration),frameCount:numeric(stream.nb_frames)};
}
function localVideo(src,root){
 if(typeof src!=='string'||!/^\/media\/[a-z0-9-]+\.(mp4|mov|webm|m4v)$/i.test(src))throw Error('Importe a mídia pelo editor para verificar seu FPS.');
 return path.join(root,'public',src.slice(1));
}
async function probe(src,root){
 const filename=localVideo(src,root),stat=await fs.stat(filename),key=filename+':'+stat.size+':'+stat.mtimeMs;
 if(cache.has(key))return cache.get(key);
 const pending=new Promise((resolve,reject)=>{
  const args=['-v','error','-select_streams','v:0','-read_intervals','%+#240','-show_entries','stream=width,height,avg_frame_rate,r_frame_rate,duration,nb_frames:format=duration:frame=best_effort_timestamp_time','-of','json',filename];
  execFile(process.env.REEL_FFPROBE||'ffprobe',args,{windowsHide:true,timeout:20000,maxBuffer:4*1024*1024},(error,stdout)=>{
   if(error)return reject(Error('Não foi possível identificar o FPS. Verifique se o FFprobe está instalado e se a mídia está disponível.'));
   try{resolve(parseVideoMetadata(src,JSON.parse(stdout)));}catch(e){reject(e);}
  });
 });
 cache.set(key,pending);if(cache.size>128)cache.delete(cache.keys().next().value);
 try{return await pending;}catch(error){cache.delete(key);throw error;}
}
export async function inspectVideo(src,root){
 const current=await probe(src,root);
 if(!/-preview\.mp4$/i.test(src))return current;
 const prefix=src.replace(/-preview\.mp4$/i,'');
 for(const ext of ['mp4','mov','webm','m4v']){
  const original=prefix+'.'+ext;
  try{await fs.access(localVideo(original,root));}catch{continue;}
  try{return {...current,original:await probe(original,root)};}catch{return current;}
 }
 return current;
}
export async function prepareRenderFrameRate(project,root){
 if(project.exportFpsMode!=='source')return project;
 const src=project.clips?.[0]?.src||project.videoSrc;
 if(!src)return project;
 const info=await inspectVideo(src,root);
 if(!info.recommendedFps)throw Error('FPS da fonte indisponível. Escolha um FPS de exportação manual antes de exportar.');
 return {...project,fps:info.recommendedFps};
}
