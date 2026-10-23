import { uid, type Cue, type Overlay, type ReelProject, type TransitionType } from './project.ts';
import {isMotionSceneId} from './motionCatalog.ts';

export type DirectorStyle = 'viral-after-effects' | 'cyber-tech' | 'minimalist-editorial';
export type DirectorIntensity = 'subtle' | 'balanced' | 'aggressive';

export interface DirectorMotionItem {
  id: string;
  type: 'kinetic-text' | 'stroke-path' | 'burst' | 'scene' | 'speed-lines' | 'camera-shake';
  name: string;
  start: number;
  end: number;
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  color?: string;
  text?: string;
  motionProps: Record<string, any>;
  sfx?: string;
}

export interface DirectorSfxItem {
  time: number;
  sfx: string;
  volume: number;
}

export interface DirectorBlueprint {
  directorVision: string;
  style: DirectorStyle;
  intensity: DirectorIntensity;
  cameraPunches: Array<{ time: number; scale: number; transition?: TransitionType; reason?: string }>;
  motionLayers: DirectorMotionItem[];
  soundDesign: DirectorSfxItem[];
}

const supportedMotionTypes = new Set<DirectorMotionItem['type']>(['kinetic-text', 'stroke-path', 'burst', 'scene', 'speed-lines', 'camera-shake']);

/** Reject hallucinated layer kinds/scenes returned by an external model before they reach the Player. */
export function sanitizeDirectorBlueprint(value: unknown, style: DirectorStyle, intensity: DirectorIntensity): DirectorBlueprint | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<DirectorBlueprint>;
  if (!Array.isArray(raw.motionLayers)) return null;
  const motionLayers = raw.motionLayers.flatMap((item: any): DirectorMotionItem[] => {
    if (!item || !supportedMotionTypes.has(item.type) || !Number.isFinite(Number(item.start)) || !Number.isFinite(Number(item.end)) || Number(item.end) <= Number(item.start)) return [];
    const motionProps = typeof item.motionProps === 'object' && item.motionProps ? {...item.motionProps} : {};
    if (item.type === 'scene' && !isMotionSceneId(motionProps.scene)) motionProps.scene = 'growth-graph';
    return [{
      id: typeof item.id === 'string' ? item.id : uid(), type: item.type, name: String(item.name || 'Motion gerado'),
      start: Math.max(0, Number(item.start)), end: Math.max(0.1, Number(item.end)),
      x: Math.max(0, Math.min(100, Number(item.x) || 50)), y: Math.max(0, Math.min(100, Number(item.y) || 35)),
      scale: Math.max(.2, Math.min(3, Number(item.scale) || 1)), rotation: Number(item.rotation) || 0,
      color: typeof item.color === 'string' ? item.color : '#ffe043', text: typeof item.text === 'string' ? item.text : '', motionProps,
      sfx: typeof item.sfx === 'string' ? item.sfx : undefined
    }];
  });
  if (!motionLayers.length) return null;
  return {
    directorVision: String(raw.directorVision || `Direção com ${motionLayers.length} motions suportados.`), style, intensity, motionLayers,
    cameraPunches: Array.isArray(raw.cameraPunches) ? raw.cameraPunches.filter((p: any) => p && Number.isFinite(Number(p.time))).map((p: any) => ({time: Number(p.time), scale: Number(p.scale) || 1, transition: p.transition, reason: String(p.reason || '')})) : [],
    soundDesign: Array.isArray(raw.soundDesign) ? raw.soundDesign.filter((s: any) => s && Number.isFinite(Number(s.time)) && typeof s.sfx === 'string').map((s: any) => ({time: Number(s.time), sfx: s.sfx, volume: Math.max(0, Math.min(1, Number(s.volume) || .7))})) : []
  };
}

const SFX_FILES: Record<string, string> = {
  whoosh: '/sfx/whoosh-fast.wav',
  'whoosh-fast': '/sfx/whoosh-fast.wav',
  'whoosh-cinematic': '/sfx/whoosh-cinematic.wav',
  boom: '/sfx/impact-boom.wav',
  'impact-boom': '/sfx/impact-boom.wav',
  stamp: '/sfx/impact-boom.wav',
  pop: '/sfx/pop-clean.wav',
  'pop-clean': '/sfx/pop-clean.wav',
  camera: '/sfx/camera-click.wav',
  'camera-click': '/sfx/camera-click.wav',
  scratch: '/sfx/vinyl-scratch.wav',
  'vinyl-scratch': '/sfx/vinyl-scratch.wav',
  ding: '/sfx/coin-ding.wav',
  'coin-ding': '/sfx/coin-ding.wav',
  riser: '/sfx/riser-speed.wav',
  'riser-speed': '/sfx/riser-speed.wav'
};

/** Analyzes transcript text semantically to generate a procedural motion graphics blueprint */
export function generateSemanticMotionBlueprint(
  cues: Cue[],
  style: DirectorStyle = 'viral-after-effects',
  intensity: DirectorIntensity = 'balanced',
  videoDuration = 15
): DirectorBlueprint {
  const duration = Math.max(1, videoDuration, ...cues.map(c => c.end));
  const motions: DirectorMotionItem[] = [];
  const sfxList: DirectorSfxItem[] = [];
  const cameraPunches: Array<{ time: number; scale: number; transition?: TransitionType; reason?: string }> = [];

  const styleColors = {
    'viral-after-effects': { primary: '#ffe043', secondary: '#ff0055', accent: '#00f0ff' },
    'cyber-tech': { primary: '#00f0ff', secondary: '#2edbf0', accent: '#7000ff' },
    'minimalist-editorial': { primary: '#e8bd55', secondary: '#ffffff', accent: '#ffe25e' }
  }[style];

  // Frequency interval in seconds based on intensity
  const minInterval = intensity === 'aggressive' ? 0.8 : intensity === 'balanced' ? 2.0 : 4.5;
  let lastMotionTime = -999;

  // 1. Hook (First 3 seconds)
  const hookCue = cues.find(c => c.start < 2.5);
  if (hookCue) {
    cameraPunches.push({
      time: 0,
      scale: 1.15,
      transition: 'flash',
      reason: 'Hook agressivo inicial'
    });
    sfxList.push({ time: 0, sfx: 'whoosh-fast', volume: 0.7 });

    if (style === 'cyber-tech') {
      motions.push({
        id: uid(),
        type: 'scene',
        name: 'Mira Óptica Hook',
        start: 0.1,
        end: Math.min(2.5, hookCue.end),
        x: 50,
        y: 35,
        scale: 0.95,
        color: styleColors.primary,
        motionProps: { scene: 'target-lock', label: 'FOCO PRINCIPAL', coordinates: 'HUD [4K] TARGET' },
        sfx: 'camera-click'
      });
      sfxList.push({ time: 0.1, sfx: 'camera-click', volume: 0.8 });
    } else {
      motions.push({
        id: uid(),
        type: 'kinetic-text',
        name: 'Palavra de Gancho 3D',
        start: 0.2,
        end: Math.min(2.2, hookCue.end),
        x: 50,
        y: 28,
        scale: 1.0,
        color: '#ffffff',
        text: hookCue.text.replace(/\[|\]/g, '').split(/\s+/).slice(0, 3).join(' ').toUpperCase(),
        motionProps: { style: '3d-tilt', accent: styleColors.primary, backdropWord: 'HOOK' },
        sfx: 'pop-clean'
      });
      sfxList.push({ time: 0.2, sfx: 'pop-clean', volume: 0.7 });
    }
    lastMotionTime = Math.min(1.6, hookCue.end);
  }

  // 2. Semantic Analysis across cues
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (cue.start < lastMotionTime + minInterval - 0.05) continue;

    const lower = cue.text.toLowerCase();
    const effectDuration = Math.min(2.2, Math.max(1.5, cue.end - cue.start));
    const end = Math.min(duration, cue.start + effectDuration);

    // Keyword Semantic Triggers
    if (/(cresce|lucro|fatur|resultado|dobr|dinheir|venda|aument|ganh)/i.test(lower)) {
      motions.push({
        id: uid(),
        type: 'scene',
        name: 'Gráfico de Crescimento Neon',
        start: cue.start,
        end,
        x: 50,
        y: 32,
        scale: 0.95,
        color: styleColors.primary,
        motionProps: { scene: 'growth-graph', label: 'RESULTADOS', metric: '+340%' },
        sfx: 'coin-ding'
      });
      sfxList.push({ time: cue.start, sfx: 'coin-ding', volume: 0.85 });
      lastMotionTime = end;
    } else if (/(funil|conversão|etapa de venda|jornada)/i.test(lower)) {
      motions.push({id:uid(),type:'scene',name:'Funil de Conversão',start:cue.start,end,x:50,y:34,scale:.85,color:styleColors.primary,text:cue.text,motionProps:{scene:'conversion-funnel',label:'FUNIL DE CONVERSÃO',metric:'12%',subtext:cue.text},sfx:'whoosh-fast'});
      sfxList.push({time:cue.start,sfx:'whoosh-fast',volume:.6}); lastMotionTime=end;
    } else if (/(ranking|primeiro lugar|top 3|melhor opção|prioridade)/i.test(lower)) {
      motions.push({id:uid(),type:'scene',name:'Ranking de Prioridade',start:cue.start,end,x:50,y:34,scale:.85,color:styleColors.primary,text:cue.text,motionProps:{scene:'ranking-podium',label:'TOP PRIORIDADES',metric:cue.text},sfx:'coin-ding'});
      sfxList.push({time:cue.start,sfx:'coin-ding',volume:.7}); lastMotionTime=end;
    } else if (/(cronograma|linha do tempo|passo a passo|primeiro.*depois|plano)/i.test(lower)) {
      motions.push({id:uid(),type:'scene',name:'Linha do Tempo',start:cue.start,end,x:50,y:35,scale:.8,color:styleColors.primary,text:cue.text,motionProps:{scene:'timeline-steps',label:'PASSO A PASSO',subtext:'COMEÇAR|AJUSTAR|CRESCER'},sfx:'whoosh-fast'});
      sfxList.push({time:cue.start,sfx:'whoosh-fast',volume:.55}); lastMotionTime=end;
    } else if (/(local|onde|mapa|encontrar|oportunidade|monitor)/i.test(lower)) {
      motions.push({id:uid(),type:'scene',name:'Radar de Oportunidade',start:cue.start,end,x:50,y:33,scale:.82,color:styleColors.accent,text:cue.text,motionProps:{scene:'radar-scan',label:'OPORTUNIDADE'},sfx:'camera-click'});
      sfxList.push({time:cue.start,sfx:'camera-click',volume:.6}); lastMotionTime=end;
    } else if (/(cadeia|dominó|consequência|efeito.*gera)/i.test(lower)) {
      motions.push({id:uid(),type:'scene',name:'Efeito Dominó',start:cue.start,end,x:50,y:36,scale:.8,color:styleColors.primary,text:cue.text,motionProps:{scene:'domino-effect',label:'EFEITO DOMINÓ',metric:cue.text},sfx:'impact-boom'});
      sfxList.push({time:cue.start,sfx:'impact-boom',volume:.7}); lastMotionTime=end;
    } else if (/(pare|vá|avance|sinal verde|atenção)/i.test(lower)) {
      motions.push({id:uid(),type:'scene',name:'Semáforo de Decisão',start:cue.start,end,x:50,y:34,scale:.76,color:styleColors.primary,text:cue.text,motionProps:{scene:'traffic-light',label:'PARE E ANALISE'},sfx:'camera-click'});
      sfxList.push({time:cue.start,sfx:'camera-click',volume:.6}); lastMotionTime=end;
    } else if (/(parabéns|conquista|atingiu|vitória|meta batida|conseguiu)/i.test(lower)) {
      motions.push({id: uid(), type: 'scene', name: 'Confete de Conquista', start: cue.start, end, x: 50, y: 36, scale: .9, color: styleColors.primary, text: cue.text, motionProps: {scene: 'confetti', label: 'META ATINGIDA'}, sfx: 'pop-clean'});
      sfxList.push({time: cue.start, sfx: 'pop-clean', volume: .75}); lastMotionTime = end;
    } else if (/(notificação|mensagem nova|novo seguidor|curtida)/i.test(lower)) {
      motions.push({id: uid(), type: 'scene', name: 'Notificação Social', start: cue.start, end, x: 50, y: 31, scale: .85, color: '#ff4f8b', text: cue.text, motionProps: {scene: 'social-notification', label: 'NOVA NOTIFICAÇÃO', subtext: cue.text}, sfx: 'pop-clean'});
      sfxList.push({time: cue.start, sfx: 'pop-clean', volume: .65}); lastMotionTime = end;
    } else if (/(pesquise|procure|busque|digite)/i.test(lower)) {
      motions.push({id: uid(), type: 'scene', name: 'Busca Animada', start: cue.start, end, x: 50, y: 31, scale: .86, color: styleColors.accent, text: cue.text, motionProps: {scene: 'search-bar', label: cue.text.slice(0, 44)}, sfx: 'whoosh-fast'});
      sfxList.push({time: cue.start, sfx: 'whoosh-fast', volume: .55}); lastMotionTime = end;
    } else if (/(clique|botão|toque|aperta)/i.test(lower)) {
      motions.push({id: uid(), type: 'scene', name: 'Cursor de Clique', start: cue.start, end, x: 50, y: 35, scale: .9, color: styleColors.primary, text: cue.text, motionProps: {scene: 'cursor-click', label: 'CLIQUE AQUI'}, sfx: 'camera-click'});
      sfxList.push({time: cue.start, sfx: 'camera-click', volume: .65}); lastMotionTime = end;
    } else if (/(seguir|segue|curte|curtir|salva|salvar|compartilha|envia|comenta|comentário)/i.test(lower)) {
      motions.push({id: uid(), type: 'scene', name: 'CTA Social de Retenção', start: cue.start, end, x: 50, y: 31, scale: .9, color: styleColors.primary, text: cue.text, motionProps: {scene: /coment/i.test(lower) ? 'social-comment' : 'social-cta', label: /coment/i.test(lower) ? 'DEIXE SEU COMENTÁRIO' : 'SALVE ESTE REEL', subtext: 'PARA VER DE NOVO DEPOIS'}, sfx: 'pop-clean'});
      sfxList.push({time: cue.start, sfx: 'pop-clean', volume: .7}); lastMotionTime = end;
    } else if (/(passo|etapa|primeiro|segundo|terceiro|lista|checklist)/i.test(lower)) {
      motions.push({id: uid(), type: 'scene', name: 'Checklist de Passos', start: cue.start, end, x: 50, y: 32, scale: .88, color: styleColors.primary, text: cue.text, motionProps: {scene: 'checklist', label: 'PASSOS IMPORTANTES', subtext: cue.text.replace(/[.!?]/g, '').split(/,| e /i).slice(0, 3).join('|')}, sfx: 'pop-clean'});
      sfxList.push({time: cue.start, sfx: 'pop-clean', volume: .6}); lastMotionTime = end;
    } else if (/(antes|depois|versus|vs\.?|compar)/i.test(lower)) {
      motions.push({id: uid(), type: 'scene', name: 'Comparação Visual', start: cue.start, end, x: 50, y: 34, scale: .85, color: '#31e981', text: cue.text, motionProps: {scene: 'comparison', label: 'ANTES', metric: 'DEPOIS', subtext: cue.text}, sfx: 'whoosh-fast'});
      sfxList.push({time: cue.start, sfx: 'whoosh-fast', volume: .65}); lastMotionTime = end;
    } else if (/(\d+%|por cento|meta|número|mil|milhão|dados?)/i.test(lower)) {
      const metric = cue.text.match(/\d+(?:[.,]\d+)?\s*%?/)?.[0] || '+100%';
      motions.push({id: uid(), type: 'scene', name: 'Contador de Métrica', start: cue.start, end, x: 50, y: 33, scale: .9, color: styleColors.accent, text: cue.text, motionProps: {scene: 'metric-counter', label: 'RESULTADO', metric, subtext: cue.text}, sfx: 'coin-ding'});
      sfxList.push({time: cue.start, sfx: 'coin-ding', volume: .75}); lastMotionTime = end;
    } else if (/(foco|olha|veja|atenção|importante|aqui)/i.test(lower)) {
      motions.push({id: uid(), type: 'scene', name: 'Spotlight de Foco', start: cue.start, end, x: 50, y: 36, scale: .82, color: styleColors.primary, text: cue.text, motionProps: {scene: 'focus-spotlight', label: cue.text.slice(0, 40)}, sfx: 'camera-click'});
      sfxList.push({time: cue.start, sfx: 'camera-click', volume: .65}); lastMotionTime = end;
    } else if (/(nunca|erro|cuidado|pare|pior|proibid|não|alerta)/i.test(lower)) {
      motions.push({
        id: uid(),
        type: 'scene',
        name: 'Carimbo de Impacto / Alerta',
        start: cue.start,
        end,
        x: 50,
        y: 30,
        scale: 1.05,
        color: '#ff0055',
        motionProps: { scene: 'stamp-impact', text: 'NUNCA FAÇA!', subtext: 'ERRO GRAVE DETECTADO' },
        sfx: 'impact-boom'
      });
      // Camera shake on stamp impact
      motions.push({
        id: uid(),
        type: 'camera-shake',
        name: 'Impact Camera Shake',
        start: cue.start,
        end: cue.start + 0.4,
        x: 50,
        y: 50,
        scale: 1,
        motionProps: { intensity: 22, cameraShake: true }
      });
      sfxList.push({ time: cue.start, sfx: 'impact-boom', volume: 0.9 });
      lastMotionTime = end;
    } else if (/(rápido|aceler|velocidade|10x|segundos|hora|minuto|tempo)/i.test(lower)) {
      motions.push({
        id: uid(),
        type: 'scene',
        name: 'Velocímetro em Vermelho',
        start: cue.start,
        end,
        x: 50,
        y: 34,
        scale: 0.9,
        color: styleColors.secondary,
        motionProps: { scene: 'speed-gauge', label: 'ACELERAÇÃO MÁXIMA', speedText: '10X' },
        sfx: 'riser-speed'
      });
      sfxList.push({ time: cue.start, sfx: 'riser-speed', volume: 0.75 });
      lastMotionTime = end;
    } else if (/(mente|cérebro|ideia|estratégia|segredo|conhec|pens)/i.test(lower)) {
      motions.push({
        id: uid(),
        type: 'scene',
        name: 'Conexão Neural de Ideias',
        start: cue.start,
        end,
        x: 50,
        y: 32,
        scale: 0.95,
        color: styleColors.accent,
        motionProps: { scene: 'neural-brain', label: 'INSIGHT ESTRATÉGICO' },
        sfx: 'whoosh-cinematic'
      });
      sfxList.push({ time: cue.start, sfx: 'whoosh-cinematic', volume: 0.7 });
      lastMotionTime = end;
    } else if (intensity === 'aggressive' && /(olha|veja|isso|aqui|preste|atenção)/i.test(lower)) {
      motions.push({
        id: uid(),
        type: 'stroke-path',
        name: 'Seta Curva de Atenção',
        start: cue.start,
        end: cue.start + 2.0,
        x: 68,
        y: 45,
        scale: 0.85,
        color: styleColors.primary,
        rotation: -25,
        motionProps: { shape: 'curved-arrow', strokeWidth: 8 },
        sfx: 'whoosh-fast'
      });
      sfxList.push({ time: cue.start, sfx: 'whoosh-fast', volume: 0.65 });
      lastMotionTime = cue.start + 2.0;
    } else if (intensity === 'aggressive') {
      // Periodic kinetic typography burst
      const words = cue.text.replace(/\[|\]/g, '').split(/\s+/).filter(w => w.length > 3);
      if (words.length > 0) {
        motions.push({
          id: uid(),
          type: 'burst',
          name: 'Explosão de Partículas',
          start: cue.start,
          end: cue.start + 1.2,
          x: 50,
          y: 40,
          scale: 1,
          color: styleColors.primary,
          motionProps: { count: 14, shape: 'spark' },
          sfx: 'pop-clean'
        });
        sfxList.push({ time: cue.start, sfx: 'pop-clean', volume: 0.6 });
        lastMotionTime = cue.start + 2.0;
      }
    }
  }

  // 3. Climax / Call To Action (Last 3 seconds)
  const ctaStart = Math.max(0, duration - 3.2);
  motions.push({
    id: uid(),
    type: 'scene',
    name: 'Decolagem / Foguete CTA',
    start: ctaStart,
    end: duration,
    x: 50,
    y: 35,
    scale: 0.9,
    color: styleColors.primary,
    motionProps: { scene: 'rocket-launch' },
    sfx: 'whoosh-cinematic'
  });
  sfxList.push({ time: ctaStart, sfx: 'whoosh-cinematic', volume: 0.8 });

  return {
    directorVision: `Direção de Motion Graphics no estilo ${style} com ritmo ${intensity}. Gerou ${motions.length} elementos gráficos e ${sfxList.length} pontos de sound design sincronizados.`,
    style,
    intensity,
    cameraPunches,
    motionLayers: motions,
    soundDesign: sfxList
  };
}

/** Compiles and injects the blueprint into a ReelProject safely without breaking existing elements */
export function applyDirectorBlueprint(
  project: ReelProject,
  blueprint: DirectorBlueprint,
  options: { replaceExistingMotion?: boolean } = {}
): ReelProject {
  const replace = options.replaceExistingMotion ?? true;

  // Filter existing overlays if replacing previous generated motion
  let remainingOverlays = project.overlays || [];
  if (replace) {
    remainingOverlays = remainingOverlays.filter(
      l => l.kind !== 'motion' && !(l.kind === 'audio' && (l.src || '').startsWith('/sfx/'))
    );
  }

  const newOverlays: Overlay[] = [];

  // 1. Add Motion Overlays (Track 3)
  for (const m of blueprint.motionLayers) {
    newOverlays.push({
      id: m.id || uid(),
      kind: 'motion',
      motionType: m.type,
      name: m.name,
      start: m.start,
      end: m.end,
      track: 3,
      x: m.x,
      y: m.y,
      scale: m.scale,
      rotation: m.rotation ?? 0,
      opacity: 1,
      color: m.color,
      text: m.text,
      motionProps: m.motionProps
    });
  }

  // 2. Add Audio SFX Overlays (Track 0)
  for (const sfx of blueprint.soundDesign) {
    const sfxFile = SFX_FILES[sfx.sfx] || `/sfx/${sfx.sfx}.wav`;
    newOverlays.push({
      id: uid(),
      kind: 'audio',
      name: `SFX — ${sfx.sfx}`,
      start: sfx.time,
      end: sfx.time + 1.2,
      track: 0,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      src: sfxFile,
      volume: sfx.volume ?? 0.8
    });
  }

  // 3. Apply Camera Transitions / Punches to Clips
  let updatedClips = [...(project.clips || [])];
  if (blueprint.cameraPunches.length > 0 && updatedClips.length > 0) {
    updatedClips = updatedClips.map((clip, idx) => {
      // Find punch near this clip's start
      const punch = blueprint.cameraPunches.find(
        p => Math.abs(p.time - clip.start) < 0.8
      );
      if (punch) {
        return {
          ...clip,
          zoom: punch.scale || clip.zoom || 1,
          transition: punch.transition ? { type: punch.transition, duration: 0.3 } : clip.transition
        };
      }
      return clip;
    });
  }

  return {
    ...project,
    clips: updatedClips,
    overlays: [...remainingOverlays, ...newOverlays]
  };
}
