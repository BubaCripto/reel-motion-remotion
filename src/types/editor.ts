import {PRESETS,type Cue,type Preset} from '../lib/project';

export type Selection = {
  kind: 'cue' | 'clip' | 'overlay' | 'word';
  id: string;
  wordId?: string;
};

export type Drag = {
  id: string;
  kind: Selection['kind'];
  wordId?: string;
  mode: 'move' | 'start' | 'end';
  startX: number;
  original: any;
  group?: Cue[];
};

export type BrandKit = {
  id: string;
  name: string;
  fontA: string;
  fontB: string;
  twoFonts: boolean;
  background: string;
  foreground: string;
  accent: string;
  creativity: number;
};

export const builtinFonts = [
  'Anton',
  'Montserrat',
  'Playfair Display',
  'Oswald',
  'Inter',
  'Caveat',
  'Libre Baskerville',
  'Arial',
  'Georgia',
  'Impact',
  'Trebuchet MS'
];

export const storage = 'reel-motion-studio-v6-library';
export const kitsStore = 'reel-motion-studio-v6-brand-kits';

export const categories = [
  {title: 'Clássicos', list: PRESETS.slice(0, 12)},
  {title: 'Referências', list: PRESETS.slice(12, 16)},
  {title: 'Motion avançado', list: PRESETS.slice(16)}
];

export const labelName = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export function formatTimecode(sec: number, fps = 30): string {
  if (isNaN(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  const f = Math.floor((sec % 1) * fps);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  const mss = String(ms).padStart(3, '0');
  return `${mm}:${ss}.${mss} (F:${f})`;
}

