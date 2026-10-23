import type {ReelProject} from './project';

export type MediaKind = 'video' | 'audio' | 'image' | 'font';
export type ProjectMedia = {src: string; kind: MediaKind; label: string; uses: number};

/** Lists every imported asset once, together with the number of timeline uses. */
export function collectProjectMedia(project: ReelProject): ProjectMedia[] {
  const found = new Map<string, ProjectMedia>();
  const add = (src: string | undefined, kind: MediaKind, label: string) => {
    if (!src || src.startsWith('data:') || src === '/demo-grid.svg') return;
    const current = found.get(src);
    if (current) current.uses++;
    else found.set(src, {src, kind, label, uses: 1});
  };
  project.clips.forEach((clip, index) => add(clip.src, 'video', `Vídeo principal · corte ${index + 1}`));
  project.overlays.forEach(layer => {
    if (layer.kind === 'audio') add(layer.src, 'audio', layer.name || 'Áudio');
    if (layer.kind === 'video') add(layer.src, 'video', layer.name || 'B-roll');
    if (layer.kind === 'image') add(layer.src, 'image', layer.name || 'Imagem');
  });
  project.fonts.forEach(font => add(font.src, 'font', font.name));
  return [...found.values()];
}

/** A relink preserves timing, styling and all layer identifiers. */
export function relinkProjectMedia(project: ReelProject, oldSrc: string, newSrc: string): ReelProject {
  return {
    ...project,
    videoSrc: project.videoSrc === oldSrc ? newSrc : project.videoSrc,
    clips: project.clips.map(clip => clip.src === oldSrc ? {...clip, src: newSrc} : clip),
    overlays: project.overlays.map(layer => layer.src === oldSrc ? {...layer, src: newSrc} : layer),
    fonts: project.fonts.map(font => font.src === oldSrc ? {...font, src: newSrc} : font)
  };
}

export function isManagedMedia(src: string): boolean {
  return /^\/(?:media|sfx)\/[a-z0-9-]+\.[a-z0-9]+$/i.test(src);
}
