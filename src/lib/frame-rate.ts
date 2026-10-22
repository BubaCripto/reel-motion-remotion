import type {ReelProject} from './project';
export type VideoFrameInfo={src:string;fps:number|null;fpsRatio:string;nominalFps:number|null;nominalRatio:string;recommendedFps:number|null;cadence:'variable'|'constant-sample'|'unknown';sampledFrames:number;width:number|null;height:number|null;duration:number|null;frameCount:number|null;original?:VideoFrameInfo};
export const COMMON_FRAME_RATES=[24000/1001,24,25,30000/1001,30,50,60000/1001,60,120000/1001,120];
export const formatFps=(fps:number|null|undefined)=>fps&&Number.isFinite(fps)?Number(fps.toFixed(3)).toLocaleString('pt-BR',{maximumFractionDigits:3}):'não identificado';
export const sameFps=(a:number|null|undefined,b:number|null|undefined)=>typeof a==='number'&&typeof b==='number'&&Math.abs(a-b)<.0005;
export function projectVideoSources(p:ReelProject){
 const sources:{src:string;role:string}[]=[];
 const add=(src:string|undefined,role:string)=>{if(src&&!sources.some(s=>s.src===src))sources.push({src,role});};
 for(const clip of p.clips)add(clip.src,'Vídeo principal');
 if(!p.clips.length)add(p.videoSrc,'Vídeo principal');
 for(const o of p.overlays)if(o.kind==='video')add(o.src,'B-roll · '+o.name);
 return sources;
}
/** All edit times are seconds: changing the grid must not retime any track. */
export function setProjectFrameRate(p:ReelProject,fps:number,mode:'source'|'manual'):ReelProject{
 if(!Number.isFinite(fps)||fps<=0||fps>240)throw Error('FPS deve estar entre 0 e 240.');
 return {...p,fps,exportFpsMode:mode};
}
