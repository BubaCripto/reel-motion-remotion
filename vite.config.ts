import {defineConfig} from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {analyzeRhythm} from './server/rhythm';
import {validateProject} from './src/lib/project';
import {inspectVideo,prepareRenderFrameRate} from './server/media-info.mjs';
const base=process.cwd(),mediaDir=path.join(base,'public','media'),renderDir=path.join(base,'public','renders');
fs.mkdirSync(mediaDir,{recursive:true});fs.mkdirSync(renderDir,{recursive:true});
type Job={state:'running'|'done'|'error';message:string;url?:string};
const jobs=new Map<string,Job>();
const answer=(res:ServerResponse,status:number,value:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));};
const collect=async(req:IncomingMessage,limit:number)=>{let size=0;const buffers:Buffer[]=[];for await(const b of req){size+=b.length;if(size>limit)throw Error('Limite de tamanho excedido');buffers.push(b);}return Buffer.concat(buffers);};
const run=(bin:string,args:string[],cwd:string,onExit:(code:number,msg:string)=>void)=>{const child=spawn(bin,args,{cwd,shell:process.platform==='win32',windowsHide:true});let buffer='';child.stdout?.on('data',c=>buffer=(buffer+c.toString()).slice(-10000));child.stderr?.on('data',c=>buffer=(buffer+c.toString()).slice(-10000));child.on('error',e=>onExit(-1,e.message));child.on('close',code=>onExit(code??1,buffer));return child;};
export default defineConfig({plugins:[{name:'reel-local-editor',configureServer(server){server.middlewares.use(async(req,res,next)=>{
 const url=req.url?.split('?')[0]||'';if(!url.startsWith('/api/'))return next();
 try{
  if(url==='/api/media-info'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,128*1024)).toString());
   if(!Array.isArray(body.sources)||body.sources.length>32||body.sources.some((s:unknown)=>typeof s!=='string'))return answer(res,400,{error:'Informe até 32 arquivos de vídeo.'});
   const sources=[...new Set(body.sources)] as string[],infos:Record<string,unknown>={},errors:Record<string,string>={};
   for(let i=0;i<sources.length;i+=4)await Promise.all(sources.slice(i,i+4).map(async src=>{try{infos[src]=await inspectVideo(src,base);}catch(error){errors[src]=error instanceof Error?error.message:String(error);}}));
   return answer(res,200,{infos,errors});
  }
  if(url==='/api/ai-rhythm'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,2*1024*1024)).toString());
   let project;try{project=validateProject(body.project);}catch(error){return answer(res,400,{error:String(error)});}
   const objective=typeof body.objective==='string'?body.objective.trim().slice(0,1500):'';
   if(!objective)return answer(res,400,{error:'Informe o objetivo do Reel para orientar a análise e o CTA.'});
   if(!project.clips.length||!project.cues.some(c=>c.source==='transcript'))return answer(res,400,{error:'Importe o vídeo e gere ou importe as legendas da fala antes de analisar.'});
   try{return answer(res,200,{analysis:await analyzeRhythm(project,objective,String(body.model||''),base)});}
   catch(error){return answer(res,503,{error:String(error)});}
  }
  if(url==='/api/upload'&&req.method==='POST'){
   const ext=String(req.headers['x-file-extension']||'').replace(/[^a-z0-9]/gi,'').toLowerCase();
   if(!['mp4','mov','webm','m4v','mp3','wav','m4a','ogg','png','jpg','jpeg','webp','svg','woff','woff2','ttf','otf'].includes(ext))return answer(res,400,{error:'Tipo de arquivo não permitido'});
   const size=ext.match(/^(mp4|mov|webm|m4v)$/)?1024*1024*1000:1024*1024*80;
   const id=crypto.randomUUID(),fname=id+'.'+ext,data=await collect(req,size),source=path.join(mediaDir,fname);
   fs.writeFileSync(source,data);
   if(ext.match(/^(mp4|mov|webm|m4v)$/)){
    const previewName=id+'-preview.mp4',preview=path.join(mediaDir,previewName),ffmpeg=process.env.REEL_FFMPEG||'ffmpeg';
    const result=await new Promise<{code:number;message:string}>(resolve=>run(ffmpeg,['-y','-i',source,'-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','veryfast','-crf','20','-g','30','-keyint_min','30','-sc_threshold','0','-pix_fmt','yuv420p','-movflags','+faststart','-c:a','aac','-b:a','160k',preview],base,(code,message)=>resolve({code,message})));
    if(result.code===0&&fs.existsSync(preview))return answer(res,200,{src:'/media/'+previewName,original:'/media/'+fname,bytes:data.length,optimized:true});
    return answer(res,200,{src:'/media/'+fname,bytes:data.length,optimized:false,warning:'FFmpeg não conseguiu otimizar o preview: '+result.message.slice(-240)});
   }
   return answer(res,200,{src:'/media/'+fname,bytes:data.length});
  }
  if(url==='/api/render'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,8*1024*1024)).toString());let p=body.project;
   if(!p||!Array.isArray(p.cues)||!Array.isArray(p.overlays)||!Array.isArray(p.clips))return answer(res,400,{error:'Projeto incompleto'});
   const refs=[p.videoSrc,...p.clips.map((c:any)=>c.src),...p.overlays.map((o:any)=>o.src),...p.fonts.map((f:any)=>f.src)].filter(Boolean);
   const allowedDemoAudio='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==';
   if(refs.some((s:any)=>typeof s!=='string'||(!/^\/media\/[a-z0-9-]+\.[a-z0-9]+$/i.test(s)&&s!=='/demo-grid.svg'&&s!==allowedDemoAudio)))return answer(res,400,{error:'Importe todos os arquivos de mídia pelo editor antes de renderizar'});
   try{p=await prepareRenderFrameRate(p,base);}catch(error){return answer(res,400,{error:error instanceof Error?error.message:String(error)});}
   const id=crypto.randomUUID(),file=path.join(renderDir,id+'.json'),out=path.join(renderDir,id+'.mp4');
   fs.writeFileSync(file,JSON.stringify({project:p}));const job:Job={state:'running',message:`Renderização Remotion · ${Number(p.fps.toFixed(3))} fps`};jobs.set(id,job);
   const exe=process.platform==='win32'?path.join(base,'node_modules','.bin','remotion.cmd'):path.join(base,'node_modules','.bin','remotion');
   run(exe,['render','src/remotion/index.ts','ReelTypography',out,'--props',file,'--codec','h264'],base,(code,msg)=>{
    if(job.state!=='running')return;
    job.state=code===0?'done':'error';job.message=code===0?'MP4 pronto':('Falha na renderização: '+msg.slice(-850));if(code===0)job.url='/renders/'+id+'.mp4';
   });return answer(res,200,{id,fps:p.fps});
  }
  if(url.startsWith('/api/render/')&&req.method==='GET'){const j=jobs.get(url.split('/').pop()||'');return answer(res,j?200:404,j??{error:'Job inexistente'});}
  if(url==='/api/silences'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,1024*1024)).toString());
   if(!/^\/media\/[a-z0-9-]+\.(mp4|mov|webm|m4v|mp3|wav|m4a)$/i.test(body.src||''))return answer(res,400,{error:'Importe o vídeo antes'});
   const fname=path.join(base,'public',String(body.src).slice(1));
   const id=crypto.randomUUID(),job:Job={state:'running',message:'FFmpeg analisando silêncio'};jobs.set(id,job);
   const exe=process.env.REEL_FFMPEG||'ffmpeg';const threshold=Number.isFinite(body.threshold)?Math.min(-20,Math.max(-55,body.threshold)):-35;
   run(exe,['-hide_banner','-i',fname,'-af',`silencedetect=noise=${threshold}dB:d=0.38`,'-f','null','-'],base,(_code,msg)=>{
    if(job.state!=='running')return;const starts=[...msg.matchAll(/silence_start:\s*([0-9.]+)/g)].map(m=>Number(m[1]));
    const ends=[...msg.matchAll(/silence_end:\s*([0-9.]+)/g)].map(m=>Number(m[1]));
    const silences=starts.map((start,i)=>({start,end:ends[i]??Number(body.duration||0)})).filter(x=>x.end>x.start);
    job.state='done';job.message='Análise finalizada';(job as any).silences=silences;
   });return answer(res,200,{id});
  }
  if(url==='/api/transcribe-words'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,1024*1024)).toString());
   if(!/^\/media\/[a-z0-9-]+\.(mp4|mov|webm|m4v|mp3|wav|m4a)$/i.test(body.src||''))return answer(res,400,{error:'Importe um vídeo ou áudio primeiro'});
   const id=crypto.randomUUID(),out=path.join(renderDir,id+'.json'),job:Job={state:'running',message:'faster-whisper sincronizando palavras'};jobs.set(id,job);
   const filename=path.join(base,'public',String(body.src).slice(1)),python=process.env.REEL_PYTHON||(process.platform==='win32'?'python':'python3');
   run(python,['scripts/transcribe_words.py',filename,String(body.model||'small'),out],base,(code,msg)=>{
    if(job.state!=='running')return;job.state=code===0&&fs.existsSync(out)?'done':'error';job.message=job.state==='done'?'Palavras sincronizadas':'faster-whisper não está pronto: '+msg.slice(-600);if(job.state==='done')job.url='/renders/'+id+'.json';
   });return answer(res,200,{id});
  }
  if(url==='/api/transcribe'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,1024*1024)).toString());
   if(!/^\/media\/[a-z0-9-]+\.(mp4|mov|webm|m4v|mp3|wav|m4a)$/i.test(body.src||''))return answer(res,400,{error:'Importe um vídeo ou áudio primeiro'});
   const id=crypto.randomUUID(),output=path.join(os.tmpdir(),'reel-transcribe-'+id);fs.mkdirSync(output,{recursive:true});
   const job:Job={state:'running',message:'Whisper está transcrevendo o arquivo'};jobs.set(id,job);
   const filename=path.join(base,'public',String(body.src).slice(1));
   const python=process.env.REEL_PYTHON|| (process.platform==='win32'?'python':'python3');
   run(python,['-m','whisper',filename,'--language',body.language||'Portuguese','--model',body.model||'small','--output_format','srt','--output_dir',output],base,(code,msg)=>{
    if(job.state!=='running')return;
    if(code!==0){job.state='error';job.message='Whisper indisponível ou falhou: '+msg.slice(-550);return;}
    const srt=fs.readdirSync(output).find(x=>x.endsWith('.srt'));
    if(!srt){job.state='error';job.message='Whisper não gerou um arquivo SRT';return;}
    const out='/renders/'+id+'.srt';fs.copyFileSync(path.join(output,srt),path.join(renderDir,id+'.srt'));job.state='done';job.message='Transcrição pronta';job.url=out;
   });return answer(res,200,{id});
  }
  if(url==='/api/ai-improve'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,512*1024)).toString());const cues=Array.isArray(body.cues)?body.cues:[];
   if(!cues.length)return answer(res,400,{error:'Transcreva ou importe legendas antes de pedir melhorias à IA.'});
   const base=(process.env.REEL_AG_BRIDGE_URL||'http://127.0.0.1:11435/v1').replace(/\/$/,'');
   const model=String(process.env.REEL_AG_MODEL||body.model||'antigravity-claude-sonnet-4-6');
   const prompt=String(body.prompt||'').slice(0,4000);
   const transcript=cues.map((c:any)=>({id:String(c.id),start:Number(c.start),end:Number(c.end),text:String(c.text||'')}));
   try{
    const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),60000);
    const r=await fetch(base+'/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer local'},signal:ctrl.signal,body:JSON.stringify({model,temperature:0.15,response_format:{type:'json_object'},messages:[{role:'system',content:'Você é um editor de vídeo criterioso. Analise uma transcrição temporizada em português. Retorne SOMENTE JSON válido no formato {"cuts":[{"start":number,"end":number,"reason":string}],"rewrites":[{"id":string,"text":string}],"summary":string}. cuts remove vícios de linguagem, frases interrompidas/erradas e pausas sem conteúdo. Nunca corte fala útil; cada corte deve ter duração entre 0.08 e 12 segundos e respeitar o tempo informado. rewrites corrigem apenas ortografia/pontuação de uma legenda, mantendo seu sentido. Não invente ids.'},{role:'user',content:`Instrução editorial do usuário: ${prompt||'Remova pausas, erros e frases incompletas, preservando a mensagem principal.'}\n\nTranscrição: ${JSON.stringify(transcript)}`}],stream:false})});clearTimeout(timeout);
    if(!r.ok)throw Error('Bridge respondeu HTTP '+r.status);const data=await r.json() as any;const raw=String(data?.choices?.[0]?.message?.content||'').replace(/^```json\s*|\s*```$/g,'');const value=JSON.parse(raw);
    const ids=new Set(transcript.map((c:any)=>c.id));const cuts=(Array.isArray(value.cuts)?value.cuts:[]).map((c:any)=>({start:Number(c.start),end:Number(c.end),reason:String(c.reason||'Trecho removido')})).filter((c:any)=>Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.end>c.start&&c.end-c.start<=12);
    const rewrites=(Array.isArray(value.rewrites)?value.rewrites:[]).map((x:any)=>({id:String(x.id),text:String(x.text||'').trim()})).filter((x:any)=>ids.has(x.id)&&x.text);
    return answer(res,200,{provider:'ag-local-bridge',model,cuts,rewrites,summary:String(value.summary||'Análise concluída.')});
   }catch(e){return answer(res,503,{error:'AG Local Bridge indisponível. Instale/inicie a extensão no Antigravity e confirme http://localhost:11435/v1/models. Detalhe: '+String(e)});}
  }
  if(url==='/api/ai-framing'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,256*1024)).toString());const cues=Array.isArray(body.cues)?body.cues:[];const start=Math.max(0,Number(body.start)||0),end=Math.max(start+.1,Number(body.end)||0);
   try{
    const base=(process.env.REEL_AG_BRIDGE_URL||'http://127.0.0.1:11435/v1').replace(/\/$/,'');const model=String(process.env.REEL_AG_GEMINI_MODEL||body.model||'antigravity-gemini-3.8-flash-medium');const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),30000);
    const r=await fetch(base+'/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer local'},signal:ctrl.signal,body:JSON.stringify({model,temperature:.25,response_format:{type:'json_object'},messages:[{role:'system',content:'Você é diretor de edição para Reels verticais. Crie enquadramentos discretos guiados pela ênfase semântica das legendas. Retorne SOMENTE JSON: {"keyframes":[{"time":number,"x":number,"y":number,"scale":number,"reason":string}]}. Produza no máximo 12 pontos. x/y são de 0 a 100, scale de 1 a 1.22. Não corte rosto deliberadamente e evite movimento excessivo.'},{role:'user',content:`Trecho de ${start}s a ${end}s. Legendas: ${JSON.stringify(cues.filter((c:any)=>Number(c.end)>start&&Number(c.start)<end).map((c:any)=>({start:c.start,end:c.end,text:c.text})))}`}],stream:false})});clearTimeout(timeout);
    if(!r.ok)throw Error('Bridge respondeu HTTP '+r.status);const data=await r.json() as any;const raw=String(data?.choices?.[0]?.message?.content||'').replace(/^```json\s*|\s*```$/g,'');const value=JSON.parse(raw);const keyframes=(Array.isArray(value.keyframes)?value.keyframes:[]).map((k:any)=>({time:Number(k.time),x:Number(k.x),y:Number(k.y),scale:Number(k.scale),reason:String(k.reason||'')})).filter((k:any)=>Number.isFinite(k.time)&&k.time>=start&&k.time<=end&&Number.isFinite(k.x)&&Number.isFinite(k.y)&&Number.isFinite(k.scale)).slice(0,12);return answer(res,200,{provider:'ag-local-bridge',model,keyframes});
   }catch(e){return answer(res,503,{error:'Gemini via AG Local Bridge indisponível. Detalhe: '+String(e)});}
  }
  if(url==='/api/ai-style'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,256*1024)).toString());
   try{
    const base=(process.env.REEL_AG_BRIDGE_URL||'http://127.0.0.1:11435/v1').replace(/\/$/,'');const model=String(process.env.REEL_AG_GEMINI_MODEL||body.model||'antigravity-gemini-3.8-flash-medium');
    const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),30000);
    const r=await fetch(base+'/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer local'},signal:ctrl.signal,body:JSON.stringify({model,temperature:.35,response_format:{type:'json_object'},messages:[{role:'system',content:'Você é diretor de motion typography. Escolha para cada legenda exatamente um estilo da lista: impact,kinetic,editorial,collage,word-by-word,slide-up,slide-side,stacked,marker,magazine,sticker,typewriter,neon-box,scribble-highlight,handwritten-mix,elegant-layered,pop,elastic,blur-reveal,mask-wipe,flip,zoom-in,zoom-out,glitch,shake,bounce,wave,cascade,fade,tracking,rubber,rotate-in,drop,punch,split,highlight-swipe,scale-out,slide-down,roll,float. Responda SOMENTE JSON no formato {"presets":["impact",...]}. Não altere palavras.'},{role:'user',content:`Gere exatamente ${body.cues?.length||0} presets para: ${JSON.stringify((body.cues||[]).map((c:any)=>c.text)).slice(0,12000)}`}],stream:false})});clearTimeout(timeout);
    if(!r.ok)throw Error('Bridge respondeu HTTP '+r.status);const data=await r.json() as any;const raw=String(data?.choices?.[0]?.message?.content||'').replace(/^```json\s*|\s*```$/g,'');return answer(res,200,{provider:'ag-local-bridge',model,...JSON.parse(raw)});
   }catch(e){return answer(res,503,{error:'Gemini via AG Local Bridge indisponível. Confirme que a bridge está ativa em localhost:11435. Detalhe: '+String(e)});}
  }
  if(url==='/api/ai-caption-review'&&req.method==='POST'){
   const body=JSON.parse((await collect(req,512*1024)).toString());const sourceCues=Array.isArray(body.cues)?body.cues:[];
   if(!sourceCues.length)return answer(res,400,{error:'Não há legendas para revisar.'});
   const base=(process.env.REEL_AG_BRIDGE_URL||'http://127.0.0.1:11435/v1').replace(/\/$/,'');const model=String(process.env.REEL_AG_GEMINI_MODEL||body.model||'antigravity-gemini-3.8-flash-medium');
   const cues=sourceCues.map((c:any)=>({id:String(c.id),start:Number(c.start),end:Number(c.end),text:String(c.text||'')}));const ids=new Set(cues.map((c:any)=>c.id));
   try{
    const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),60000);
    const r=await fetch(base+'/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer local'},signal:ctrl.signal,body:JSON.stringify({model,temperature:.05,response_format:{type:'json_object'},messages:[{role:'system',content:'Você revisa legendas do Whisper em português brasileiro para um editor de Reels. Corrija palavras claramente transcritas errado, pontuação, concordância e quebras de frase usando o contexto temporal. Não invente fatos nem altere id, início ou fim. Em cada texto, marque entre [colchetes] uma a três palavras-chave faladas que merecem destaque visual. Retorne SOMENTE JSON {"cues":[{"id":"id original","text":"texto revisado com [destaques]"}]}, com exatamente um item por id.'},{role:'user',content:`Arquivo transcrito: ${String(body.src||'').slice(0,180)}. Legendas com tempos: ${JSON.stringify(cues)}`}],stream:false})});clearTimeout(timeout);
    if(!r.ok)throw Error('Bridge respondeu HTTP '+r.status);const data=await r.json() as any;const raw=String(data?.choices?.[0]?.message?.content||'').replace(/^```json\s*|\s*```$/g,'');const value=JSON.parse(raw);const revised=new Map((Array.isArray(value.cues)?value.cues:[]).map((c:any)=>[String(c.id),String(c.text||'').trim()]));
    const originalById=new Map(sourceCues.map((c:any)=>[String(c.id),c]));const output=cues.map((c:any)=>({...originalById.get(c.id),text:revised.has(c.id)&&revised.get(c.id)?revised.get(c.id):c.text})).filter((c:any)=>ids.has(c.id));return answer(res,200,{provider:'ag-local-bridge',model,cues:output});
   }catch(e){return answer(res,503,{error:'Gemini via AG Local Bridge não revisou as legendas. Detalhe: '+String(e)});}
  }
  return answer(res,404,{error:'Endpoint inexistente'});
 }catch(e){return answer(res,500,{error:String(e)});}
 });}}]});
