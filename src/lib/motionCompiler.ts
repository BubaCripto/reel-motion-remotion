import { uid, type Cue, type Overlay, type ReelProject, type TransitionType } from './project.ts';

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
