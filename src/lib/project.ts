/** Reel Motion Studio V6 - project schema. All times are seconds, coordinates percent of canvas. */
export const PRESETS = [
 'impact','kinetic','editorial','collage','word-by-word','slide-up','slide-side','stacked','marker','magazine','sticker','typewriter',
 'neon-box','scribble-highlight','handwritten-mix','elegant-layered',
 'pop','elastic','blur-reveal','mask-wipe','flip','zoom-in','zoom-out','glitch','shake','bounce','wave','cascade',
 'fade','tracking','rubber','rotate-in','drop','punch','split','highlight-swipe','scale-out','slide-down','roll','float'
] as const;
export type Preset = typeof PRESETS[number];
export type Motion = 'linear'|'ease'|'spring'|'bounce';
export type TransitionType = 'none' | 'crossfade' | 'zoom-in' | 'zoom-out' | 'whip-right' | 'whip-left' | 'flash';
export type Keyframe = {time:number; x?:number;y?:number;scale?:number;rotate?:number;opacity?:number};
export type Word = {id:string;text:string;highlight?:boolean;start:number;end:number; preset?:Preset;accent?:string;scale?:number;offsetX?:number;offsetY?:number};
export type Cue = {id:string;start:number;end:number;text:string;source?:'transcript'|'manual';x?:number;y?:number;scale?:number;preset?:Preset;fontA?:string;fontB?:string;twoFonts?:boolean;fontWeight?:number;italic?:boolean;align?:'left'|'center'|'right';strokeWidth?:number;strokeColor?:string;highlightMode?:'color'|'box'|'underline'|'outline';accent?:string;foreground?:string;animationSpeed?:number;track?:number; keyframes?:Keyframe[];words?:Word[];rotation?:number;opacity?:number;outlineFill?:boolean;karaoke?:boolean};
export type VideoClip = {id:string;src:string;start:number;end:number;sourceStart:number;speed:number;muted?:boolean;volume?:number;zoom?:number;x?:number;y?:number;keyframes?:Keyframe[];transition?:{type:TransitionType;duration?:number}};
export type ColorGradePreset = 'none' | 'teal-orange' | 'moody-dark' | 'clean-bright' | 'cyber-neon' | 'monochrome';
export const COLOR_GRADE_STYLES: Record<ColorGradePreset, { filter: string; overlayGradient?: string }> = {
  'none': { filter: 'none' },
  'teal-orange': {
    filter: 'contrast(1.12) saturate(1.18) sepia(0.06)',
    overlayGradient: 'linear-gradient(135deg, rgba(0, 150, 200, 0.08) 0%, rgba(255, 120, 0, 0.08) 100%)'
  },
  'moody-dark': {
    filter: 'contrast(1.24) brightness(0.9) saturate(0.82)',
    overlayGradient: 'radial-gradient(circle at center, transparent 30%, rgba(10, 15, 25, 0.25) 100%)'
  },
  'clean-bright': {
    filter: 'brightness(1.06) contrast(1.08) saturate(1.12)',
    overlayGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 0%, transparent 100%)'
  },
  'cyber-neon': {
    filter: 'contrast(1.25) saturate(1.45) hue-rotate(10deg)',
    overlayGradient: 'linear-gradient(45deg, rgba(255, 0, 128, 0.07) 0%, rgba(0, 240, 255, 0.07) 100%)'
  },
  'monochrome': {
    filter: 'grayscale(1) contrast(1.32) brightness(0.96)',
    overlayGradient: 'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.35) 100%)'
  }
};
export type AspectRatioPreset = '9:16' | '4:5' | '1:1' | '16:9';
export const ASPECT_RATIOS: Record<AspectRatioPreset, { width: number; height: number; label: string }> = {
  '9:16': { width: 1080, height: 1920, label: '9:16 (Reels/TikTok)' },
  '4:5': { width: 1080, height: 1350, label: '4:5 (Feed Portrait)' },
  '1:1': { width: 1080, height: 1080, label: '1:1 (Feed Quadrado)' },
  '16:9': { width: 1920, height: 1080, label: '16:9 (YouTube)' },
};

export function detectAspectRatio(width: number, height: number): { ratio: AspectRatioPreset; width: number; height: number; label: string } {
  if (!width || !height) return { ratio: '9:16', ...ASPECT_RATIOS['9:16'] };
  const r = width / height;
  if (r >= 1.45) return { ratio: '16:9', ...ASPECT_RATIOS['16:9'] };
  if (r >= 0.92 && r <= 1.08) return { ratio: '1:1', ...ASPECT_RATIOS['1:1'] };
  if (r >= 0.72 && r < 0.92) return { ratio: '4:5', ...ASPECT_RATIOS['4:5'] };
  return { ratio: '9:16', ...ASPECT_RATIOS['9:16'] };
}

export function createBlankProject(name = 'Novo Projeto', options: Partial<ReelProject> = {}): ReelProject {
  const ratio = options.aspectRatio ?? '9:16';
  const dimensions = ASPECT_RATIOS[ratio] || ASPECT_RATIOS['9:16'];
  return {
    exportFpsMode: 'source',
    id: uid(),
    name,
    fps: 30,
    width: options.width ?? dimensions.width,
    height: options.height ?? dimensions.height,
    aspectRatio: ratio,
    colorGrade: 'none',
    creativity: 70,
    preset: 'word-by-word',
    fontA: 'Inter',
    fontB: 'Playfair Display',
    twoFonts: false,
    background: '#101116',
    foreground: '#ffffff',
    accent: '#ffe043',
    transparent: false,
    seed: Math.floor(Math.random() * 1000),
    videoSrc: '',
    videoDuration: options.videoDuration ?? 10,
    clips: [],
    cues: [],
    overlays: [],
    fonts: [],
    safeZone: true,
    ...options
  };
}
export type MotionOverlayType = 'kinetic-text' | 'stroke-path' | 'burst' | 'scene' | 'speed-lines' | 'camera-shake';
export type Overlay = {id:string;kind:'shape'|'image'|'video'|'text'|'effect'|'audio'|'motion';name:string;start:number;end:number;track:number;x:number;y:number;scale:number;rotation:number;opacity:number;src?:string;text?:string;type?:'rectangle'|'circle'|'arrow'|'line'|'scribble'|'flash'|'grain'|'vignette'|'zoom-pulse';color?:string;strokeColor?:string;strokeWidth?:number;fontA?:string;fontWeight?:number;preset?:Preset;keyframes?:Keyframe[];volume?:number;sourceStart?:number;speed?:number;muted?:boolean;mediaRole?:'logo'|'broll';frameWidth?:number;frameHeight?:number;motionType?:MotionOverlayType;motionProps?:Record<string, any>;ducking?:boolean;duckingAmount?:number};
export type FontItem = {name:string;src:string};
export type ReelProject = {id:string;name:string;fps:number;width:number;height:number;aspectRatio?:AspectRatioPreset;colorGrade?:ColorGradePreset;creativity:number;preset:Preset;fontA:string;fontB:string;twoFonts:boolean;background:string;foreground:string;accent:string;transparent:boolean;seed:number;videoSrc?:string;videoDuration?:number;clips:VideoClip[];cues:Cue[];overlays:Overlay[];fonts:FontItem[];safeZone?:boolean;introTrim?:number;exportFpsMode?:'source'|'manual';editorial?:RhythmAnalysis;rhythmVariant?:RhythmVariant;templateOrigin?:TemplateOrigin};
export const initialProject:ReelProject={exportFpsMode:'source',id:'demo',name:'Demo completo — Motion Studio',fps:30,width:1080,height:1920,creativity:72,preset:'kinetic',fontA:'Anton',fontB:'Playfair Display',twoFonts:true,background:'#101116',foreground:'#ffffff',accent:'#e8bd55',transparent:false,seed:17,videoSrc:'',videoDuration:12,clips:[],fonts:[],safeZone:true,cues:[{id:'demo-1',start:0,end:2.6,text:'Todo recurso em um [SÓ LUGAR]',x:50,y:68,preset:'neon-box',accent:'#2edbf0'},{id:'demo-2',start:2.6,end:5.4,text:'LEGENDAS que viram [MOTION]',x:50,y:69,preset:'handwritten-mix',accent:'#ffe043'},{id:'demo-3',start:5.4,end:8.5,text:'CORTES rápidos. Ideias [CLARAS.]',x:50,y:68,preset:'scribble-highlight',accent:'#ffe25e'},{id:'demo-4',start:8.5,end:12,text:'PRONTO PARA [PUBLICAR]',x:50,y:69,preset:'impact',highlightMode:'box',accent:'#e8bd55'}],overlays:[{id:'demo-title',kind:'text',name:'Título introdutório',text:'REEL MOTION',start:0,end:2.5,track:3,x:50,y:18,scale:1,rotation:0,opacity:1,color:'#e8bd55',fontA:'Montserrat',fontWeight:800,keyframes:[{time:0,x:50,y:12,scale:.7,opacity:0},{time:.45,x:50,y:18,scale:1,opacity:1}]},{id:'demo-arrow',kind:'shape',type:'arrow',name:'Seta animada',start:.35,end:2.45,track:3,x:72,y:35,scale:.9,rotation:-18,opacity:1,color:'#2edbf0',strokeWidth:10},{id:'demo-circle',kind:'shape',type:'circle',name:'Círculo de destaque',start:2.7,end:5.3,track:3,x:18,y:26,scale:.42,rotation:0,opacity:.9,color:'#e8bd55'},{id:'demo-line',kind:'shape',type:'line',name:'Linha editorial',start:5.5,end:8.3,track:3,x:50,y:31,scale:1,rotation:0,opacity:1,color:'#ffe25e',strokeWidth:12},{id:'demo-scribble',kind:'shape',type:'scribble',name:'Rabisco de destaque',start:8.7,end:11.8,track:3,x:50,y:55,scale:1.05,rotation:0,opacity:1,color:'#e8bd55',strokeWidth:12},{id:'demo-flash',kind:'effect',type:'flash',name:'Flash de entrada',start:0,end:.22,track:4,x:50,y:50,scale:1,rotation:0,opacity:.45,color:'#ffffff'},{id:'demo-grain',kind:'effect',type:'grain',name:'Textura grain',start:0,end:12,track:4,x:50,y:50,scale:1,rotation:0,opacity:1,color:'#ffffff'},{id:'demo-vignette',kind:'effect',type:'vignette',name:'Vinheta',start:0,end:12,track:4,x:50,y:50,scale:1,rotation:0,opacity:.72,color:'#000000'}]};
const demoLabel=(preset:Preset)=>preset.replace(/-/g,' ').toUpperCase();
initialProject.name='Demo completo — todos os estilos e elementos';
initialProject.videoDuration=PRESETS.length*2.6;
initialProject.cues=PRESETS.map((preset,index)=>{const start=index*2.6;return {id:`demo-preset-${preset}`,start,end:start+2.45,text:`ESTILO [${demoLabel(preset)}]`,x:50,y:index%3===0?64:index%3===1?70:74,preset,accent:['#e8bd55','#2edbf0','#ff6b9e'][index%3],highlightMode:index%4===0?'box':index%4===1?'outline':index%4===2?'underline':'color',fontA:index%2?'Montserrat':'Anton',fontB:index%2?'Caveat':'Playfair Display',twoFonts:index%3===0,fontWeight:800,rotation:index%2?0:-2} as Cue;});
initialProject.overlays=[
 {id:'demo-text',kind:'text',name:'Texto independente',text:'DEMO COMPLETO',start:0,end:2.4,track:3,x:50,y:17,scale:1,rotation:0,opacity:1,color:'#e8bd55',fontA:'Montserrat',fontWeight:900,keyframes:[{time:0,x:50,y:10,scale:.6,opacity:0},{time:.5,x:50,y:17,scale:1,opacity:1}]},
 {id:'demo-rectangle',kind:'shape',type:'rectangle',name:'Retângulo',start:2.6,end:5,track:3,x:50,y:23,scale:1,rotation:0,opacity:.8,color:'#2edbf0'},
 {id:'demo-circle',kind:'shape',type:'circle',name:'Círculo',start:5.2,end:7.6,track:3,x:18,y:28,scale:.45,rotation:0,opacity:.9,color:'#e8bd55'},
 {id:'demo-arrow',kind:'shape',type:'arrow',name:'Seta',start:7.8,end:10.2,track:3,x:72,y:35,scale:.9,rotation:-18,opacity:1,color:'#ff6b9e',strokeWidth:10},
 {id:'demo-line',kind:'shape',type:'line',name:'Linha',start:10.4,end:12.8,track:3,x:50,y:30,scale:1,rotation:0,opacity:1,color:'#ffe25e',strokeWidth:12},
 {id:'demo-scribble',kind:'shape',type:'scribble',name:'Rabisco',start:13,end:15.4,track:3,x:50,y:55,scale:1.05,rotation:0,opacity:1,color:'#e8bd55',strokeWidth:12},
 {id:'demo-image',kind:'image',name:'Imagem demonstrativa',src:'/demo-grid.svg',start:15.6,end:18,track:3,x:50,y:30,scale:1,rotation:0,opacity:1,color:'#ffffff'},
 {id:'demo-audio',kind:'audio',name:'Áudio demonstrativo',src:'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==',start:0,end:PRESETS.length*2.6,track:0,x:50,y:50,scale:1,rotation:0,opacity:1,volume:.3},
 {id:'demo-flash',kind:'effect',type:'flash',name:'Flash',start:18.2,end:18.45,track:4,x:50,y:50,scale:1,rotation:0,opacity:.6,color:'#ffffff'},
 {id:'demo-vignette',kind:'effect',type:'vignette',name:'Vinheta',start:18.6,end:21,track:4,x:50,y:50,scale:1,rotation:0,opacity:.75,color:'#000000'},
 {id:'demo-grain',kind:'effect',type:'grain',name:'Grain',start:21.2,end:23.6,track:4,x:50,y:50,scale:1,rotation:0,opacity:1,color:'#ffffff'},
 {id:'demo-zoom',kind:'effect',type:'zoom-pulse',name:'Zoom pulse',start:23.8,end:26.2,track:4,x:50,y:50,scale:1,rotation:0,opacity:1,color:'#ffffff'}
];

/** The new-project demo is deliberately long: each supported motion gets an editable timeline block. */
const DEMO_MOTION_SCENES = [
 ['growth-graph','Gráfico de crescimento','RESULTADOS','+340%'],
 ['target-lock','Mira de foco','FOCO PRINCIPAL',''],
 ['rocket-launch','Foguete CTA','SIGA PARA MAIS',''],
 ['stamp-impact','Carimbo de impacto','NÃO FAÇA ISSO','ERRO GRAVE'],
 ['hazard-warning','Alerta','ATENÇÃO','PONTO CRÍTICO'],
 ['hourglass','Ampulheta','TEMPO É DINHEIRO',''],
 ['speed-gauge','Velocímetro','ACELERE','10X'],
 ['neural-brain','Rede neural','INSIGHT','ESTRATÉGIA'],
 ['social-cta','CTA social','SALVE ESTE REEL','PARA VER DE NOVO'],
 ['social-comment','Comentário social','DEIXE UM COMENTÁRIO','QUAL SUA DÚVIDA?'],
 ['metric-counter','Contador de métrica','RESULTADO','+340%'],
 ['comparison','Comparação','ANTES','DEPOIS'],
 ['checklist','Checklist','3 PASSOS','GANCHO|CORTE|CTA'],
 ['progress-bar','Barra de progresso','PROGRESSO','80%'],
 ['focus-spotlight','Foco / lupa','OLHE AQUI',''],
 ['calendar-clock','Relógio e prazo','COMECE HOJE','24H'],
 ['social-notification','Notificação social','NOVO SEGUIDOR','VEJA AGORA'],
 ['social-profile','Perfil social','SEU PERFIL','@SEUPERFIL'],
 ['search-bar','Busca animada','PESQUISE ISTO',''],
 ['cursor-click','Cursor / clique','CLIQUE AQUI',''],
 ['glitch-rgb','Glitch RGB','QUEBRE O PADRÃO',''],
 ['impact-flash','Flash de impacto','IMPACTO',''],
 ['crt-vhs','CRT / VHS','NOVA FASE',''],
 ['confetti','Confete','META ATINGIDA',''],
 ['bar-chart','Gráfico de barras','RESULTADOS','+84%'],
 ['conversion-funnel','Funil de conversão','FUNIL DE VENDAS','12%'],
 ['ranking-podium','Ranking / pódio','TOP 3','PRIORIDADE'],
 ['timeline-steps','Linha do tempo','PLANO DE AÇÃO','COMEÇAR|AJUSTAR|CRESCER'],
 ['radar-scan','Radar / mapa','OPORTUNIDADE',''],
 ['domino-effect','Efeito dominó','EFEITO DOMINÓ','AÇÃO GERA AÇÃO'],
 ['traffic-light','Semáforo','PARE E ANALISE',''],
 ['balance-scale','Balança','ESCOLHA CERTA','EQUILÍBRIO']
] as const;

initialProject.overlays.push(...DEMO_MOTION_SCENES.map(([scene,name,label,metric],index)=>{
 const start=28+index*2.6;
 return {
  id:`demo-motion-${scene}`,kind:'motion' as const,motionType:'scene' as const,name:`Motion · ${name}`,
  text:label,start,end:start+2.35,track:3,x:50,y:scene==='focus-spotlight'?43:33,scale:scene==='impact-flash'||scene==='crt-vhs'?1:.82,
  rotation:0,opacity:1,color:['#ffe043','#2edbf0','#ff6b9e','#31e981'][index%4],
  motionProps:{scene,label,metric,subtext:metric}
 };
}));
initialProject.videoDuration=Math.max(initialProject.videoDuration||0,...initialProject.overlays.map(o=>o.end));
export const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v));
export function uid(){return (typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():'id-'+Math.random().toString(36).slice(2);}
export function durationFrames(p:ReelProject){return Math.max(30,Math.ceil(Math.max(1,p.videoDuration||0,...p.cues.map(c=>c.end),...(p.clips||[]).map(c=>c.end),...(p.overlays||[]).map(c=>c.end))*p.fps));}
export const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
export function parseSrt(raw:string):Cue[]{const result:Cue[]=[];for(const b of raw.replace(/\r/g,'').trim().split(/\n\s*\n/)){const lines=b.split('\n'),at=lines.findIndex(s=>s.includes('-->'));if(at<0)continue;const [startText,endText]=lines[at].split('-->').map(t=>t.trim());const toSec=(t:string)=>{const a=t.replace(',','.').split(':').map(Number);return a.length===3?a[0]*3600+a[1]*60+a[2]:NaN;};const start=toSec(startText),end=toSec(endText),text=lines.slice(at+1).join(' ').replace(/<[^>]*>/g,'').trim();if(text&&Number.isFinite(start)&&Number.isFinite(end)&&end>start)result.push({id:uid(),start,end,text,source:'transcript',x:50,y:55});}return result;}
export function parsePlain(raw:string,seconds=2.5){return raw.split(/\n+/).map(s=>s.trim()).filter(Boolean).map((text,i)=>({id:uid(),start:i*seconds,end:(i+1)*seconds,text,x:50,y:70} as Cue));}
export function textTokens(text:string):{text:string;highlight:boolean}[]{return [...text.matchAll(/\[([^\]]+)\]|([^\s]+)/g)].map(x=>({text:x[1]??x[2],highlight:!!x[1]}));}
export function splitWords(c:Cue):Word[]{const t=textTokens(c.text);const weights=t.map(w=>Math.max(1,w.text.replace(/[^\p{L}\p{N}]/gu,'').length)**.7);const sum=weights.reduce((a,b)=>a+b,0)||1;let pos=c.start;return t.map((t,i)=>{const start=pos,end=i===weights.length-1?c.end:Math.min(c.end,pos+(c.end-c.start)*weights[i]/sum);pos=end;return {id:`${c.id}:w${i}`,text:t.text,highlight:t.highlight,start,end};});}
export function normalizeWords(c:Cue):Word[]{const t=textTokens(c.text);if(c.words?.length===t.length&&c.words.every((w,i)=>w.text===t[i].text))return c.words;return splitWords(c);}
export function validateProject(input:unknown):ReelProject{if(!input||typeof input!=='object')throw Error('Projeto JSON inválido');const p=input as Partial<ReelProject>;if(!Array.isArray(p.cues)||!p.cues.every(c=>typeof c.text==='string'&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.end>c.start))throw Error('Legendas inválidas');const r={...clone(initialProject),...p,exportFpsMode:p.exportFpsMode==='source'?'source':'manual',cues:p.cues,clips:Array.isArray(p.clips)?p.clips:[],overlays:Array.isArray(p.overlays)?p.overlays:[],fonts:Array.isArray(p.fonts)?p.fonts:[]} as ReelProject;if(r.width<100||r.height<100||r.fps<=0)throw Error('Resolução ou FPS inválidos');return r;}
export function saveJson(p:ReelProject){const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=p.name.replace(/[^a-z0-9_-]+/gi,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
export const downloadJson=saveJson;
/** Legacy cues are authored project text. Only an explicit source belongs to the transcript track. */
export const isTranscript=(cue:Cue)=>cue.source==='transcript';
export function cueTracks(cues:Cue[]){
 return {captions:cues.filter(isTranscript),texts:cues.filter(c=>!isTranscript(c))};
}
/** All transcription entry points use this boundary, including SRT and AI review results. */
export function replaceTranscript(project:ReelProject,incoming:Cue[]):ReelProject{
 if(!incoming.length||incoming.some(c=>typeof c.text!=='string'||!c.text.trim()||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start))throw Error('A transcrição contém legendas inválidas. O projeto foi preservado.');
 const texts=cueTracks(project.cues).texts;
 const used=new Set(texts.map(c=>c.id));
 const captions=incoming.map(c=>{
  let id=c.id;
  if(!id||used.has(id))id=uid();
  used.add(id);
  return {...c,id,source:'transcript' as const,track:1,
   // Captions have their own layout; do not inherit the authored text preset or position.
   x:c.x??50,y:c.y??55,scale:c.scale??.6,preset:c.preset??'word-by-word' as Preset,
   fontA:c.fontA??'Inter',twoFonts:c.twoFonts??false,fontWeight:c.fontWeight??700,
   foreground:c.foreground??'#ffffff',accent:c.accent??project.accent,
   highlightMode:c.highlightMode??'color' as const,
   ...(c.words?{words:c.words.map(w=>({...w,id:id===c.id?w.id:uid()}))}:{})};
 });
 return {...project,cues:[...texts,...captions]};
}
export function animatedValue(k:Keyframe[]|undefined,time:number,property:keyof Pick<Keyframe,'x'|'y'|'scale'|'rotate'|'opacity'>,fallback:number){const list=(k||[]).filter(v=>typeof v[property]==='number').sort((a,b)=>a.time-b.time);if(!list.length)return fallback;if(time<=list[0].time)return list[0][property] as number;for(let i=1;i<list.length;i++){if(time<=list[i].time){const a=list[i-1],b=list[i],t=clamp((time-a.time)/(b.time-a.time||1),0,1),e=t*t*(3-2*t);return (a[property] as number)*(1-e)+(b[property] as number)*e;}}return list[list.length-1][property] as number;}
export const seconds=(v:number)=>Math.max(0,v).toFixed(2)+'s';
export const CUE_STYLE_KEYS = [
  'preset','fontA','fontB','twoFonts','fontWeight','italic',
  'align','highlightMode','foreground','accent','strokeWidth',
  'strokeColor','scale','x','y','rotation','opacity','animationSpeed','outlineFill','karaoke'
] as const;
export type CueStyleKey = typeof CUE_STYLE_KEYS[number];
export type CueStylePatch = Partial<Pick<Cue, CueStyleKey>>;
export function isCueStyleKey(key: string): key is CueStyleKey {
  return (CUE_STYLE_KEYS as readonly string[]).includes(key);
}
export function applyStyleToCues(cues: Cue[], targetIds: string[], patch: CueStylePatch): Cue[] {
  if (!targetIds.length || !Object.keys(patch).length) return cues;
  const targetSet = new Set(targetIds);
  return cues.map(cue => targetSet.has(cue.id) ? { ...cue, ...patch } : cue);
}
export const LEFT_PANEL_MIN = 240;
export const LEFT_PANEL_MAX = 520;
export const RIGHT_PANEL_MIN = 200;
export const RIGHT_PANEL_MAX = 420;
export const MIN_PREVIEW_WIDTH = 380;
export const RESIZERS_WIDTH = 14;

export function computeInitialPanelWidths(windowWidth?: number): { left: number; right: number } {
  if (typeof windowWidth !== 'number' || !Number.isFinite(windowWidth)) {
    return { left: LEFT_PANEL_MAX, right: RIGHT_PANEL_MAX };
  }
  const available = windowWidth - MIN_PREVIEW_WIDTH - RESIZERS_WIDTH;
  const totalMax = LEFT_PANEL_MAX + RIGHT_PANEL_MAX;
  if (available >= totalMax) {
    return { left: LEFT_PANEL_MAX, right: RIGHT_PANEL_MAX };
  }
  const totalMin = LEFT_PANEL_MIN + RIGHT_PANEL_MIN;
  const clamped = clamp(available, totalMin, totalMax);
  const ratio = (clamped - totalMin) / (totalMax - totalMin || 1);
  return {
    left: Math.round(LEFT_PANEL_MIN + ratio * (LEFT_PANEL_MAX - LEFT_PANEL_MIN)),
    right: Math.round(RIGHT_PANEL_MIN + ratio * (RIGHT_PANEL_MAX - RIGHT_PANEL_MIN))
  };
}
import type {RhythmAnalysis,RhythmVariant} from './rhythm';
import type {TemplateOrigin} from './templates';

