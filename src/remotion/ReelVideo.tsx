import React from 'react';
import {AbsoluteFill,Audio,OffthreadVideo,Img,Sequence,interpolate,spring,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {animatedValue,clamp,normalizeWords,textTokens,type Cue,type ReelProject,type Overlay,type Preset,type VideoClip} from '../lib/project';
import {
  KineticTypography,
  SvgStrokePath,
  BurstParticles,
  SpeedLinesOverlay,
  CameraShakeWrapper,
  GrowthGraphScene,
  TargetLockScene,
  RocketLaunchScene,
  StampImpactScene,
  HazardWarningScene,
  HourglassScene,
  SpeedGaugeScene,
  NeuralBrainScene
} from './motion';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadMontserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as loadOswald} from '@remotion/google-fonts/Oswald';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';
import {loadFont as loadLibre} from '@remotion/google-fonts/LibreBaskerville';
const map:Record<string,string>={Anton:loadAnton().fontFamily,'Playfair Display':loadPlayfair().fontFamily,Montserrat:loadMontserrat().fontFamily,Oswald:loadOswald().fontFamily,Inter:loadInter().fontFamily,Caveat:loadCaveat().fontFamily,'Libre Baskerville':loadLibre().fontFamily};
const font=(s?:string)=>map[s||'']||s||'Arial';
const media=(src?:string)=>!src?'':src.startsWith('/media/')||src.startsWith('/sfx/')||src==='/demo-grid.svg'?staticFile(src.slice(1)):src;
const rand=(seed:number,i:number)=>{const n=Math.sin(seed*78.233+i*12.989)*43758.5453;return n-Math.floor(n)};
function motion(preset:Preset,enter:number,frame:number,i:number,intensity:number,random:number):React.CSSProperties{
 const off=1-enter;
 const rotate=(random-.5)*intensity*20;
 const transformMap:Partial<Record<Preset,string>>={
  'slide-up':`translateY(${off*190}px)`, 'slide-down':`translateY(${-off*190}px)`, 'slide-side':`translateX(${off*(i%2?180:-180)}px)`,
  'zoom-in':`scale(${.15+.85*enter})`, 'zoom-out':`scale(${1.6-.6*enter})`, 'pop':`scale(${.3+.7*enter})`,
  'bounce':`scale(${.35+.65*enter})`, 'elastic':`scale(${.3+.7*enter})`, 'rotate-in':`rotate(${off*(i%2?-130:130)}deg)`,
  'roll':`translateX(${-off*240}px) rotate(${-off*190}deg)`, 'flip':`perspective(700px) rotateY(${off*90}deg)`,
  'float':`translateY(${Math.sin(frame*.12+i)*7*intensity-off*80}px)`, 'wave':`translateY(${Math.sin(frame*.16+i*.8)*14*intensity-off*65}px)`,
  'rubber':`scaleX(${1+Math.sin(frame*.5)*off*.45}) scaleY(${1-Math.sin(frame*.5)*off*.3})`,
  'shake':`translateX(${Math.sin(frame*2+i)*off*40}px)`, 'glitch':`translate(${Math.sin(frame*3+i)*off*26}px,${Math.cos(frame*2+i)*off*15}px)`,
  'punch':`scale(${.5+enter*.5})`, 'split':`translateX(${off*(i%2?250:-250)}px)`,
  'cascade':`translateY(${off*(i%3+1)*85}px)`,'drop':`translateY(${-off*280}px)`,
  'collage':`rotate(${rotate}deg) translateY(${off*85}px)`, 'magazine':`rotate(${rotate}deg) translateX(${off*80}px)`,
  'sticker':`rotate(${rotate*1.4}deg) scale(${.35+.65*enter})`,
  'stacked':`translateY(${off*110}px)`, 'marker':`translateY(${off*80}px)`,
  'kinetic':`translateY(${off*55}px)`, 'editorial':`translateY(${off*25}px)`,
 };
 const blur=['blur-reveal','mask-wipe'].includes(preset)?off*20:0;
 const opacity=preset==='typewriter'? (frame>=i*3?1:0):clamp(enter,0,1);
 return {transform:transformMap[preset]||`translateY(${off*60}px)`,opacity,filter:blur?`blur(${blur}px)`:undefined,clipPath:preset==='mask-wipe'||preset==='highlight-swipe'?`inset(0 ${100-enter*100}% 0 0)`:undefined};
}

const ReferenceCaption:React.FC<{cue:Cue;p:ReelProject;preset:Preset;frame:number;fps:number;enter:number;fade:number;time:number}>=({cue,p,preset,frame,fps,enter,fade,time})=>{
 const a=cue.accent??(preset==='neon-box'?'#2edbf0':preset==='scribble-highlight'?'#ffe25e':preset==='handwritten-mix'?'#ffe043':'#e9c34f');
 const white=cue.foreground??p.foreground;const words=textTokens(cue.text),highlight=Math.max(0,words.findIndex(w=>w.highlight));
 const text=words.map(w=>w.text);const script=cue.fontB??(preset==='handwritten-mix'?'Caveat':'Libre Baskerville');
 const stroke=(cue.strokeWidth??0)>0?`${cue.strokeWidth}px ${cue.strokeColor??'#000'}`:undefined;
 const base:React.CSSProperties={color:white,fontFamily:font(cue.fontA??p.fontA),fontWeight:cue.fontWeight??900,fontStyle:cue.italic?'italic':'normal',WebkitTextStroke:stroke,textAlign:cue.align??'center',letterSpacing:-2,lineHeight:1.06,paintOrder:'stroke fill',textShadow:'0 3px 9px #0008'};
 const x=animatedValue(cue.keyframes,time,'x',cue.x??50),y=animatedValue(cue.keyframes,time,'y',cue.y??(preset==='neon-box'?24:65)),sc=animatedValue(cue.keyframes,time,'scale',cue.scale??.85);
 const rot=animatedValue(cue.keyframes,time,'rotate',cue.rotation??0);
 const shell:React.CSSProperties={position:'absolute',left:`${x}%`,top:`${y}%`,width:'91%',transform:`translate(-50%,-50%) translateY(${(1-enter)*100}px) rotate(${rot}deg) scale(${sc})`,opacity:fade*animatedValue(cue.keyframes,time,'opacity',cue.opacity??1),textAlign:cue.align??'center'};
 const anim=(i:number)=>spring({frame:frame-i*2,fps,config:{damping:13,stiffness:130}});
 if(preset==='neon-box')return <AbsoluteFill><div style={shell}><div style={{padding:30,margin:12,background:'#0a0a0c',boxShadow:'14px 14px 0 #ed4168,-14px -14px 0 #2edbf0',transform:`scale(${.9+.1*enter})`}}><div style={{...base,fontSize:62,letterSpacing:-1}}>{words.map((w,i)=><React.Fragment key={i}><span style={{color:w.highlight?a:white}}>{w.text}</span>{i<words.length-1?' ':''}</React.Fragment>)}</div></div></div></AbsoluteFill>;
 if(preset==='scribble-highlight')return <AbsoluteFill><div style={shell}><div style={{...base,fontSize:text.length>8?80:108}}>{text.map((w,i)=><span key={i} style={{display:'inline-block',margin:'3px 9px',padding:i===highlight?'0 16px':0,color:i===highlight?'#151515':white,background:i===highlight?a:undefined,transform:`translateY(${(1-anim(i))*60}px)`,opacity:anim(i)}}>{w}</span>)}</div><svg viewBox="0 0 900 210" style={{position:'absolute',top:'46%',left:0,width:'100%',height:'55%',overflow:'visible'}}><path d="M70 110 C150 -10 750 -2 838 104 C936 222 40 230 70 110" fill="none" stroke={a} strokeWidth="13" strokeLinecap="round" strokeDasharray="1900" strokeDashoffset={1900*(1-anim(8))}/></svg></div></AbsoluteFill>;
 if(preset==='handwritten-mix')return <AbsoluteFill><div style={shell}><div style={{...base,textAlign:cue.align??'left',fontSize:92,textTransform:'uppercase'}}>{text.slice(0,Math.max(1,highlight)).join(' ')}</div><div style={{...base,fontFamily:font(script),fontSize:123,fontWeight:700,fontStyle:'italic',color:a,lineHeight:.9,textAlign:cue.align??'left',transform:`rotate(-5deg) translateX(${(1-enter)*170}px)`}}>{text[highlight]}</div><div style={{...base,textAlign:cue.align??'left',fontSize:94,textTransform:'uppercase'}}>{text.slice(highlight+1).join(' ')}</div></div></AbsoluteFill>;
 return <AbsoluteFill><div style={shell}><div style={{...base,fontSize:110}}>{text.slice(0,Math.max(1,highlight)).join(' ')}</div><div style={{background:a,display:'inline-block',padding:'2px 22px',transform:`translateX(${(1-enter)*180}px)`}}><span style={{...base,fontFamily:font(script),fontStyle:'italic',fontSize:115,fontWeight:700}}>{text[highlight]}</span></div><div style={{...base,fontSize:91}}>{text.slice(highlight+1).join(' ')}</div></div></AbsoluteFill>;
};

const Caption:React.FC<{cue:Cue;p:ReelProject;index:number;frames:number}>=({cue,p,index,frames})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),time=cue.start+frame/fps,preset=cue.preset??p.preset,intensity=p.creativity/100;
 const enter=spring({frame:frame*(cue.animationSpeed??1),fps,config:{damping:14,stiffness:85+intensity*100}});
 const leave=interpolate(frame,[Math.max(0,frames-8),Math.max(1,frames)],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 if(['neon-box','scribble-highlight','handwritten-mix','elegant-layered'].includes(preset)&&!cue.words?.some(w=>w.preset))return <ReferenceCaption cue={cue} p={p} preset={preset} frame={frame} fps={fps} enter={enter} fade={leave} time={time}/>;
 const words=normalizeWords(cue),size=words.length<=3?154:words.length<=7?115:words.length<=12?94:76;
 const x=animatedValue(cue.keyframes,time,'x',cue.x??50),y=animatedValue(cue.keyframes,time,'y',cue.y??70),scale=animatedValue(cue.keyframes,time,'scale',cue.scale??.85);
 const rotate=animatedValue(cue.keyframes,time,'rotate',cue.rotation??0),opacity=animatedValue(cue.keyframes,time,'opacity',cue.opacity??1);
 const align=cue.align??'center',justify=align==='left'?'flex-start':align==='right'?'flex-end':'center';
 const accent=cue.accent??p.accent,normal=cue.foreground??p.foreground,stroke=cue.strokeWidth?`${cue.strokeWidth}px ${cue.strokeColor??'#000000'}`:undefined;
 return <AbsoluteFill style={{pointerEvents:'none'}}><div style={{position:'absolute',left:`${x}%`,top:`${y}%`,width:'92%',transform:`translate(-50%,-50%) rotate(${rotate}deg) scale(${scale})`,opacity:opacity*leave,textAlign:align}}><div style={{display:'flex',justifyContent:justify,alignItems:'center',flexWrap:'wrap',gap:'7px 14px'}}>
 {words.map((w,i)=>{const stagger=['typewriter','word-by-word','cascade','tracking'].includes(preset)?Math.max(1,Math.min(13,frames/words.length)):Math.max(1,2*intensity);
 const localTime=(w.start-cue.start)*fps;
 const wordProgress=cue.words?.length?frame-localTime:frame-i*stagger;
 const ease=spring({frame:wordProgress,fps,config:{stiffness:['pop','punch','bounce'].includes(w.preset??preset)?230:120,damping:['elastic','bounce'].includes(w.preset??preset)?8:13}});
 const activePreset=w.preset??preset,second=(cue.twoFonts??p.twoFonts)&&(i%3===1),hot=w.highlight;
 const box=hot&&(cue.highlightMode==='box'||['marker','sticker','highlight-swipe'].includes(preset));
 const color=hot?(box?p.background:(w.accent??accent)):normal;
 const style=motion(activePreset,ease,frame,i,intensity,rand(p.seed+index*5,i));
 const fillProgress = interpolate(time, [w.start, w.end], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
 const isWordActive = time >= w.start && time <= w.end;
 const wordAccent = w.accent ?? accent;
 const karaokeStyle: React.CSSProperties = cue.karaoke ? {
   backgroundImage: `linear-gradient(to right, ${wordAccent} ${fillProgress}%, ${normal} ${fillProgress}%)`,
   WebkitBackgroundClip: 'text',
   WebkitTextFillColor: 'transparent',
   color: 'transparent'
 } : {};
 return <span key={w.id} style={{display:'inline-block',position:'relative',whiteSpace:'pre',padding:box?'2px 13px':'0 2px',background:box?(w.accent??accent):undefined,color,fontFamily:font(second?(cue.fontB??p.fontB):(cue.fontA??p.fontA)),fontSize:size*(w.scale??1)*(hot||(cue.karaoke&&isWordActive)?1.09:1),fontWeight:cue.fontWeight??850,fontStyle:cue.italic?'italic':'normal',lineHeight:1.02,letterSpacing:-2,textTransform:preset==='editorial'?'none':'uppercase',WebkitTextStroke:stroke??(hot&&cue.highlightMode==='outline'?`4px ${accent}`:undefined),paintOrder:'stroke fill',textDecoration:hot&&cue.highlightMode==='underline'?'underline':undefined,textDecorationThickness:7,textUnderlineOffset:9,textShadow:'0 4px 8px #0008',...style,...karaokeStyle,transform:`translate(${w.offsetX??0}px,${w.offsetY??0}px) ${style.transform||''}`}}>{w.text}</span>;
 })}</div></div></AbsoluteFill>;
};

const OverlayView:React.FC<{layer:Overlay}>=({layer:l})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),now=l.start+frame/fps;
 const x=animatedValue(l.keyframes,now,'x',l.x),y=animatedValue(l.keyframes,now,'y',l.y),scale=animatedValue(l.keyframes,now,'scale',l.scale),rotate=animatedValue(l.keyframes,now,'rotate',l.rotation),opacity=animatedValue(l.keyframes,now,'opacity',l.opacity);
 const intro=spring({frame,fps,config:{damping:14,stiffness:115}}),outro=interpolate(frame,[Math.max(0,(l.end-l.start)*fps-7),Math.max(1,(l.end-l.start)*fps)],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 if(l.kind==='audio')return l.src?<Audio src={media(l.src)} volume={clamp(l.volume??1,0,2)}/>:null;
 if(l.kind==='effect'&&l.type==='flash')return <AbsoluteFill style={{background:l.color??'#ffffff',opacity:opacity*(1-intro)*outro,pointerEvents:'none'}}/>;
 if(l.kind==='effect'&&l.type==='vignette')return <AbsoluteFill style={{boxShadow:'inset 0 0 400px 180px #000b',opacity:opacity*outro,pointerEvents:'none'}}/>;
 if(l.kind==='effect'&&l.type==='grain')return <AbsoluteFill style={{backgroundImage:'repeating-radial-gradient(circle,#fff3 0px,transparent 1px,#0002 2px)',backgroundSize:'4px 4px',opacity:.2*opacity,pointerEvents:'none'}}/>;
 if((l.kind==='image'||l.kind==='video')&&!l.src)return null;
 const style:React.CSSProperties={position:'absolute',left:`${x}%`,top:`${y}%`,transform:`translate(-50%,-50%) rotate(${rotate}deg) scale(${scale*(l.mediaRole==='broll'?1:.7+.3*intro)})`,opacity:opacity*outro,width:l.kind==='image'||l.kind==='video'?`${l.frameWidth??(l.kind==='video'?100:50)}%`:undefined,height:l.frameHeight?`${l.frameHeight}%`:undefined,textAlign:'center',pointerEvents:'none'};
 if(l.kind==='image'&&l.src)return <AbsoluteFill><Img src={media(l.src)} style={{...style,objectFit:l.mediaRole==='broll'?'cover':'contain'}}/></AbsoluteFill>;
 if(l.kind==='video'&&l.src)return <AbsoluteFill><OffthreadVideo src={media(l.src)} startFrom={Math.round((l.sourceStart??0)*fps)} playbackRate={l.speed??1} muted={l.muted??true} pauseWhenBuffering={false} style={{...style,objectFit:'cover'}}/></AbsoluteFill>;
 if(l.kind==='text')return <AbsoluteFill><div style={{...style,whiteSpace:'pre-wrap',maxWidth:'92%',fontFamily:font(l.fontA),fontSize:100,fontWeight:l.fontWeight??800,color:l.color??'#fff',WebkitTextStroke:l.strokeWidth?`${l.strokeWidth}px ${l.strokeColor??'#000'}`:undefined,paintOrder:'stroke fill',textShadow:'0 4px 8px #000a'}}>{l.text}</div></AbsoluteFill>;
 if(l.kind==='effect'&&l.type==='zoom-pulse')return null;
 if(l.type==='scribble')return <AbsoluteFill><svg style={{position:'absolute',left:`${x}%`,top:`${y}%`,width:`${scale*500}px`,height:`${scale*200}px`,transform:`translate(-50%,-50%) rotate(${rotate}deg)`,opacity:opacity}} viewBox="0 0 500 200"><path d="M42 105 C88 8 433 8 457 103 C489 190 55 207 42 105" fill="none" stroke={l.color??'#eac34b'} strokeWidth={l.strokeWidth??12} strokeLinecap="round" strokeDasharray="1150" strokeDashoffset={1150*(1-intro)}/></svg></AbsoluteFill>;
 if(l.type==='arrow'||l.type==='line')return <AbsoluteFill><svg style={{position:'absolute',left:`${x}%`,top:`${y}%`,transform:`translate(-50%,-50%) rotate(${rotate}deg) scale(${scale})`,opacity:opacity}} width="460" height="160"><path d={l.type==='arrow'?'M25 80 L410 80 M365 35 L418 80 L365 125':'M15 80 L440 80'} stroke={l.color??'#efc35b'} strokeWidth={l.strokeWidth??10} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="560" strokeDashoffset={560*(1-intro)}/></svg></AbsoluteFill>;
 if(l.kind==='motion'){
  const props=l.motionProps||{};
  let content:React.ReactNode=null;
  switch(l.motionType){
   case 'kinetic-text':
    content=<KineticTypography text={l.text||props.text||l.name} motionStyle={props.style??'3d-tilt'} accent={props.accent??l.color??'#ffe043'} color={props.color??'#ffffff'} fontA={props.fontA??l.fontA??'Anton'} outline={props.outline??true} backdropWord={props.backdropWord} fontSize={props.fontSize??110} align={props.align??'center'} fps={fps} frame={frame}/>;
    break;
   case 'stroke-path':
    content=<SvgStrokePath shape={props.shape||(l.type as any)||'curved-arrow'} color={l.color||props.color||'#ffe043'} strokeWidth={l.strokeWidth||props.strokeWidth||10} angle={props.angle||l.rotation||0} scale={scale} fps={fps} frame={frame}/>;
    break;
   case 'burst':
    content=<BurstParticles count={props.count||12} colors={props.colors||[l.color||'#ffe043','#ff0055','#00f0ff','#ffffff']} radius={props.radius||240} shape={props.shape||'spark'} fps={fps} frame={frame}/>;
    break;
   case 'speed-lines':
    return <SpeedLinesOverlay count={props.count||24} color={l.color||props.color||'rgba(255, 255, 255, 0.35)'} intensity={props.intensity||1} frame={frame} fps={fps}/>;
   case 'camera-shake':
    return null;
   case 'scene':
   default:{
    const scene=props.scene||'growth-graph';
    switch(scene){
     case 'growth-graph':content=<GrowthGraphScene label={props.label} metric={props.metric} color={l.color||props.color} fps={fps} frame={frame}/>;break;
     case 'target-lock':content=<TargetLockScene label={props.label} coordinates={props.coordinates} color={l.color||props.color} fps={fps} frame={frame}/>;break;
     case 'rocket-launch':content=<RocketLaunchScene color={l.color||props.color} fps={fps} frame={frame}/>;break;
     case 'stamp-impact':content=<StampImpactScene text={props.text||l.text} color={l.color||props.color} subtext={props.subtext} fps={fps} frame={frame}/>;break;
     case 'hazard-warning':content=<HazardWarningScene label={props.label||l.text} color={l.color||props.color} fps={fps} frame={frame}/>;break;
     case 'hourglass':content=<HourglassScene label={props.label} color={l.color||props.color} fps={fps} frame={frame}/>;break;
     case 'speed-gauge':content=<SpeedGaugeScene label={props.label} speedText={props.speedText} color={l.color||props.color} fps={fps} frame={frame}/>;break;
     case 'neural-brain':content=<NeuralBrainScene label={props.label} color={l.color||props.color} fps={fps} frame={frame}/>;break;
     default:content=<GrowthGraphScene label={props.label} metric={props.metric} color={l.color||props.color} fps={fps} frame={frame}/>;break;
    }
    break;
   }
  }
  return <AbsoluteFill style={{pointerEvents:'none'}}><div style={{position:'absolute',left:`${x}%`,top:`${y}%`,transform:`translate(-50%,-50%) rotate(${rotate}deg) scale(${scale})`,opacity:opacity*outro,pointerEvents:'none'}}>{content}</div></AbsoluteFill>;
 }
 return <AbsoluteFill><div style={{...style,width:l.type==='circle'?280:450,height:l.type==='circle'?280:125,background:l.color??'#e7bf57',borderRadius:l.type==='circle'?'50%':12,boxShadow:'0 12px 30px #0004'}}/></AbsoluteFill>;
};

const VideoLayer:React.FC<{clip:VideoClip;p:ReelProject}>=({clip,p})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),at=clip.start+frame/fps;
 const zoom=animatedValue(clip.keyframes,at,'scale',clip.zoom??1),x=animatedValue(clip.keyframes,at,'x',clip.x??50),y=animatedValue(clip.keyframes,at,'y',clip.y??50);

 let transTransform = '';
 let transOpacity = 1;
 let flashOpacity = 0;

 if (clip.transition?.type && clip.transition.type !== 'none') {
   const transFrames = Math.max(1, Math.round((clip.transition.duration ?? 0.35) * fps));
   const progress = interpolate(frame, [0, transFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

   switch (clip.transition.type) {
     case 'crossfade':
       transOpacity = progress;
       break;
     case 'zoom-in':
       transTransform = `scale(${0.75 + 0.25 * progress})`;
       transOpacity = progress;
       break;
     case 'zoom-out':
       transTransform = `scale(${1.3 - 0.3 * progress})`;
       transOpacity = progress;
       break;
     case 'whip-right':
       transTransform = `translateX(${(1 - progress) * 100}%)`;
       break;
     case 'whip-left':
       transTransform = `translateX(${-(1 - progress) * 100}%)`;
       break;
     case 'flash':
       flashOpacity = interpolate(frame, [0, transFrames * 0.4, transFrames], [0, 0.95, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
       break;
   }
 }

 return (
   <AbsoluteFill style={{overflow:'hidden', opacity: transOpacity, transform: transTransform || undefined}}>
     <OffthreadVideo
       src={media(clip.src)}
       startFrom={Math.round(clip.sourceStart*fps)}
       playbackRate={clip.speed}
       muted={clip.muted}
       pauseWhenBuffering={false}
       style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`${x}% ${y}%`,transform:`scale(${zoom})`}}
     />
     {flashOpacity > 0 && (
       <AbsoluteFill style={{background:'#ffffff', opacity: flashOpacity, pointerEvents:'none'}} />
     )}
   </AbsoluteFill>
 );
};

export const ReelVideo:React.FC<{project:ReelProject}>=({project:p})=>{
 const frame=useCurrentFrame();
 const legacy=!p.clips?.length&&p.videoSrc;
 const layers=[...(p.overlays??[])].sort((a,b)=>a.track-b.track),isBroll=(l:Overlay)=>l.kind==='video'||l.mediaRole==='broll';
 const renderLayer=(layer:Overlay)=><Sequence key={layer.id} premountFor={p.fps} from={Math.max(0,Math.round(layer.start*p.fps))} durationInFrames={Math.max(1,Math.round((layer.end-layer.start)*p.fps))}><OverlayView layer={layer}/></Sequence>;

 const now=frame/p.fps;
 const activeShake=layers.find(l=>l.kind==='motion'&&(l.motionType==='camera-shake'||l.motionProps?.cameraShake)&&now>=l.start&&now<=l.end);
 const shakeFrame=activeShake?Math.round((now-activeShake.start)*p.fps):0;
 const shakeDecay=activeShake?Math.max(1,Math.round((activeShake.end-activeShake.start)*p.fps)):10;
 const shakeIntensity=activeShake?.motionProps?.intensity??16;

 const content=(
  <AbsoluteFill style={{background:p.transparent?'transparent':p.background}}>
  {p.fonts?.map(f=><style key={f.name}>{`@font-face{font-family:'${f.name.replace(/['"<>]/g,'')}';src:url('${media(f.src)}');font-display:block;}`}</style>)}
  {legacy&&<OffthreadVideo src={media(p.videoSrc)} pauseWhenBuffering={false} style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
  {p.clips?.map(clip=><Sequence key={clip.id} from={Math.round(clip.start*p.fps)} durationInFrames={Math.max(1,Math.round((clip.end-clip.start)*p.fps))}><VideoLayer clip={clip} p={p}/></Sequence>)}
  {layers.filter(isBroll).map(renderLayer)}
  {p.cues.map((c,i)=><Sequence key={c.id} from={Math.max(0,Math.round(c.start*p.fps))} durationInFrames={Math.max(1,Math.round((c.end-c.start)*p.fps))}><Caption cue={c} p={p} index={i} frames={Math.max(1,Math.round((c.end-c.start)*p.fps))}/></Sequence>)}
  {layers.filter(l=>!isBroll(l)).map(renderLayer)}
  </AbsoluteFill>
 );

 return activeShake?(
  <CameraShakeWrapper frame={shakeFrame} intensity={shakeIntensity} decayFrames={shakeDecay}>
   {content}
  </CameraShakeWrapper>
 ):content;
};
