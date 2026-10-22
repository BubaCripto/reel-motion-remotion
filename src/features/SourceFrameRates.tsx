import React,{useEffect,useMemo,useState} from 'react';
import {formatFps,projectVideoSources,sameFps,type VideoFrameInfo} from '../lib/frame-rate';
import type {ReelProject} from '../lib/project';

export function useSourceFrameRates(project:ReelProject){
 const sources=useMemo(()=>projectVideoSources(project),[project.clips,project.videoSrc,project.overlays]);
 const key=JSON.stringify(sources.map(s=>s.src));
 const [infos,setInfos]=useState<Record<string,VideoFrameInfo>>({}),[errors,setErrors]=useState<Record<string,string>>({}),[loading,setLoading]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{if(!sources.length){setLoading(false);setErrors({});return;}
  const ctrl=new AbortController();setLoading(true);setErrors({});
  void(async()=>{const next:Record<string,VideoFrameInfo>={},failures:Record<string,string>={};
   try{for(let i=0;i<sources.length;i+=32){const batch=sources.slice(i,i+32).map(s=>s.src);const response=await fetch('/api/media-info',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sources:batch}),signal:ctrl.signal}),data=await response.json();if(!response.ok)throw Error(data.error||'Falha ao verificar FPS.');Object.assign(next,data.infos);Object.assign(failures,data.errors);}
    if(!ctrl.signal.aborted){setInfos(previous=>({...previous,...next}));setErrors(failures);}
   }catch(e){if(!ctrl.signal.aborted)setErrors(Object.fromEntries(sources.map(s=>[s.src,e instanceof Error?e.message:String(e)])));}finally{if(!ctrl.signal.aborted)setLoading(false);}
  })();return()=>ctrl.abort();
 },[key,refresh]);
 const mainSrc=project.clips[0]?.src||project.videoSrc,main=mainSrc?infos[mainSrc]:undefined;
 return {sources,infos,errors,main,loading,retry:()=>setRefresh(n=>n+1)};
}
export function SourceFrameRates({project,state,onUseSource}:{project:ReelProject;state:ReturnType<typeof useSourceFrameRates>;onUseSource:()=>void}){
 const {sources,infos,errors,main,loading,retry}=state;
 const rates=sources.map(s=>infos[s.src]?.fps).filter((n):n is number=>!!n),mixed=rates.some(n=>!sameFps(n,rates[0]));
 const mismatch=!!main?.recommendedFps&&!sameFps(project.fps,main.recommendedFps);
 return <section className="sourceFpsPanel" aria-label="FPS da mídia e exportação"><h4>FPS DA MÍDIA</h4>
  {!sources.length?<p>Importe um vídeo para identificar os quadros por segundo.</p>:<>
   {loading&&<small role="status">Identificando FPS com FFprobe…</small>}
   <p>Fonte principal: <strong>{formatFps(main?.original?.fps??main?.fps)} fps</strong><br/>Exportação: <strong>{formatFps(project.fps)} fps</strong> · {project.exportFpsMode==='source'?'automática':'manual'}</p>
   {mismatch&&<p className="fpsWarning" role="status">A exportação está diferente da fonte. Isso pode repetir ou descartar quadros para converter a cadência.</p>}
   {(main?.cadence==='variable'||main?.original?.cadence==='variable')&&<p className="fpsWarning">FPS variável detectado na amostra da fonte. A saída será constante em {formatFps(main?.recommendedFps)} fps no modo automático.</p>}
   {mixed&&<p className="fpsWarning">Há mídias com FPS diferentes. Um MP4 usa uma única taxa; o modo automático segue o primeiro vídeo principal.</p>}
   {main?.recommendedFps&&<button disabled={loading||project.exportFpsMode==='source'&&!mismatch} onClick={onUseSource}>Usar FPS da fonte · {formatFps(main.recommendedFps)}</button>}
   <details><summary>Dados dos arquivos</summary>{sources.map(s=>{const info=infos[s.src];return <div className="sourceFpsItem" key={s.src}><strong>{s.role}</strong><small>{s.src.split('/').pop()}</small>{info&&<p>{formatFps(info.fps)} fps{info.fpsRatio?` (${info.fpsRatio})`:''} · {info.width} × {info.height}<br/>{info.cadence==='variable'?'Cadência variável na amostra':info.cadence==='constant-sample'?'Sem variação na amostra':'Cadência não verificada'}{info.frameCount?` · ${info.frameCount} quadros`:''}{info.original&&<><br/>Original: {formatFps(info.original.fps)} fps{!sameFps(info.fps,info.original.fps)&&' · diferente do arquivo editável'}</>}</p>}{errors[s.src]&&<p className="fpsWarning">{errors[s.src]}</p>}</div>;})}</details>
   {Object.keys(errors).length>0&&<button disabled={loading} onClick={retry}>Verificar FPS novamente</button>}
  </>}
 </section>;
}
