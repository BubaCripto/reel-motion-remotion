import React, {useState, useEffect, useMemo, useRef, type PointerEvent as RPointerEvent} from 'react';
import {createRoot} from 'react-dom/client';
import type {PlayerRef} from '@remotion/player';
import {
  PRESETS,
  initialProject,
  validateProject,
  parseSrt,
  replaceTranscript,
  isTranscript,
  cueTracks,
  normalizeWords,
  uid,
  clone,
  durationFrames,
  splitWords,
  clamp,
  seconds,
  isCueStyleKey,
  LEFT_PANEL_MIN,
  LEFT_PANEL_MAX,
  RIGHT_PANEL_MIN,
  RIGHT_PANEL_MAX,
  computeInitialPanelWidths,
  type CueStylePatch,
  type Cue,
  type Word,
  type Keyframe,
  type ReelProject,
  type VideoClip,
  type Overlay,
  type Preset
} from './lib/project';
import {RhythmPanel} from './features/rhythm/RhythmPanel';
import {TemplatesPanel} from './features/templates/TemplatesPanel';
import {useSourceFrameRates} from './features/SourceFrameRates';
import {sameFps, setProjectFrameRate} from './lib/frame-rate';
import {
  rhythmSignature,
  rhythmDuration,
  applyRhythmSuggestion,
  dismissRhythmSuggestion,
  createRhythmVariants,
  selectRhythmVersion,
  type RhythmAnalysis
} from './lib/rhythm';
import {Topbar} from './components/layout/Topbar';
import {SidebarRight} from './components/layout/SidebarRight';
import {PreviewStage} from './components/preview/PreviewStage';
import {Timeline} from './components/timeline/Timeline';
import {EditPanel} from './components/panels/EditPanel';
import {StylesPanel} from './components/panels/StylesPanel';
import {EffectsPanel} from './components/panels/EffectsPanel';
import {AiPanel} from './components/panels/AiPanel';
import {LibraryPanel} from './components/panels/LibraryPanel';
import {useShortcuts} from './hooks/useShortcuts';
import {builtinFonts, storage, kitsStore, type Selection, type Drag, type BrandKit} from './types/editor';

import './editor.css';
import './style.css';
import './features/source-frame-rates.css';

function ProjectStudio() {
  const [p, setP] = useState<ReelProject>(() => clone(initialProject));
  const liveProject = useRef(p);
  liveProject.current = p;

  const history = useRef<ReelProject[]>([]);
  const future = useRef<ReelProject[]>([]);

  const [selected, select] = useState<Selection | null>({kind: 'cue', id: 'a'});
  const [selectedCueIds, setSelectedCueIds] = useState<string[]>([]);
  const [applyToAllSelected, setApplyToAllSelected] = useState(true);

  const [cursor, setCursor] = useState(0);
  const [zoom, setZoom] = useState(82);
  const [playing, setPlaying] = useState(false);
  const [wordExpanded, setWordExpanded] = useState(true);
  const [keyframeMode, setKeyframeMode] = useState(false);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [renderJob, setRenderJob] = useState('');
  const [out, setOut] = useState('');
  const [batchFiles, setBatchFiles] = useState<string[]>([]);

  const [panel, setPanel] = useState<'styles' | 'edit' | 'effects' | 'library' | 'ai' | 'rhythm' | 'templates'>('edit');
  const [focusedRhythm, setFocusedRhythm] = useState<string>('');
  const [addText, setAddText] = useState('Nova [LEGENDA]');
  const [model, setModel] = useState('small');
  const [aiPrompt, setAiPrompt] = useState('Remova pausas longas, vícios de linguagem, frases incompletas e erros evidentes. Preserve as ideias importantes e deixe o vídeo mais direto.');
  const [agModel, setAgModel] = useState('antigravity-gemini-3.8-flash-medium');
  const [aiSummary, setAiSummary] = useState('');

  const [safeZone, setSafeZone] = useState(true);
  const [safeTarget, setSafeTarget] = useState<'reels' | 'post'>('reels');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapLine, setSnapLine] = useState<number | null>(null);

  const [initialPanelWidths] = useState(() => computeInitialPanelWidths(typeof window !== 'undefined' ? window.innerWidth : undefined));
  const [leftWidth, setLeftWidth] = useState(initialPanelWidths.left);
  const [rightWidth, setRightWidth] = useState(initialPanelWidths.right);
  const [timelineHeight, setTimelineHeight] = useState(330);

  const [kitName, setKitName] = useState('Minha identidade');
  const [brandKits, setBrandKits] = useState<BrandKit[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(kitsStore) || '[]');
    } catch {
      return [];
    }
  });

  const [library, setLibrary] = useState<ReelProject[]>(() => {
    try {
      return (JSON.parse(localStorage.getItem(storage) || '[]') as unknown[]).map(validateProject);
    } catch {
      return [];
    }
  });

  const player = useRef<PlayerRef>(null);
  const pickerVideo = useRef<HTMLInputElement>(null);
  const pickerSrt = useRef<HTMLInputElement>(null);
  const pickerFont = useRef<HTMLInputElement>(null);
  const pickerImage = useRef<HTMLInputElement>(null);
  const pickerAudio = useRef<HTMLInputElement>(null);
  const pickerJson = useRef<HTMLInputElement>(null);

  const timeline = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const scrubbing = useRef(false);
  const posDrag = useRef<{startX: number; startY: number; originX: number; originY: number} | null>(null);
  const captionPreviewOrigins = useRef<Cue[] | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const previewStage = useRef<HTMLDivElement>(null);
  const resize = useRef<{kind: 'left' | 'right' | 'timeline'; start: number; size: number} | null>(null);

  const fps = p.fps;
  const duration = durationFrames(p) / fps;

  useEffect(() => {
    const r = player.current;
    if (!r) return;
    const update = (event: {detail: {frame: number}}) => setCursor(event.detail.frame / p.fps);
    r.addEventListener('frameupdate', update);
    return () => r.removeEventListener('frameupdate', update);
  }, [p.fps]);

  useEffect(() => {
    if (!notice && !error) return;
    const id = window.setTimeout(() => {
      setNotice('');
      setError('');
    }, 5200);
    return () => window.clearTimeout(id);
  }, [notice, error]);

  const cue = selected?.kind === 'word' || selected?.kind === 'cue' ? p.cues.find(c => c.id === selected.id) : undefined;
  const transcriptCues = useMemo(() => cueTracks(p.cues).captions, [p.cues]);
  const word = cue && selected?.kind === 'word' ? normalizeWords(cue).find(w => w.id === selected.wordId) : undefined;
  const overlay = selected?.kind === 'overlay' ? p.overlays.find(o => o.id === selected.id) : undefined;
  const clip = selected?.kind === 'clip' ? p.clips.find(c => c.id === selected.id) : undefined;
  const fonts = [...builtinFonts, ...p.fonts.map(x => x.name)];

  const rec = () => {
    history.current.push(clone(liveProject.current));
    if (history.current.length > 90) history.current.shift();
    future.current = [];
  };

  const change = (d: Partial<ReelProject>, undo = true) => {
    if (undo) rec();
    setP(x => ({...x, ...d}));
  };

  const editCue = (id: string, d: Partial<Cue>, undo = true) => {
    if (undo) rec();
    const isMulti = applyToAllSelected && selectedCueIds.length > 1 && selectedCueIds.includes(id);
    const styleKeys = Object.keys(d).filter(isCueStyleKey);
    if (isMulti && styleKeys.length > 0) {
      const stylePatch = Object.fromEntries(Object.entries(d).filter(([k]) => isCueStyleKey(k))) as CueStylePatch;
      const indivPatch = Object.fromEntries(Object.entries(d).filter(([k]) => !isCueStyleKey(k)));
      setP(x => ({
        ...x,
        cues: x.cues.map(v => {
          if (selectedCueIds.includes(v.id)) {
            const base = {...v, ...stylePatch};
            return v.id === id ? {...base, ...indivPatch} : base;
          }
          return v;
        })
      }));
      return;
    }
    setP(x => ({...x, cues: x.cues.map(v => (v.id === id ? {...v, ...d} : v))}));
  };

  const editLayer = (id: string, d: Partial<Overlay>, undo = true) => {
    if (undo) rec();
    setP(x => ({...x, overlays: x.overlays.map(v => (v.id === id ? {...v, ...d} : v))}));
  };

  const editClip = (id: string, d: Partial<VideoClip>, undo = true) => {
    if (undo) rec();
    setP(x => ({...x, clips: x.clips.map(v => (v.id === id ? {...v, ...d} : v))}));
  };

  const editWord = (id: string, wid: string, d: Partial<Word>, undo = true) => {
    const c = p.cues.find(v => v.id === id);
    if (!c) return;
    if (undo) rec();
    setP(x => ({
      ...x,
      cues: x.cues.map(v => {
        if (v.id !== id) return v;
        const words = normalizeWords(v).map(w => (w.id === wid ? {...w, ...d} : w));
        return {
          ...v,
          words,
          text: d.text === undefined ? v.text : words.map(w => (w.highlight ? `[${w.text}]` : w.text)).join(' ')
        };
      })
    }));
  };

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(clone(p));
    setP(prev);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(clone(p));
    setP(next);
  };

  const seek = (t: number) => {
    const sec = clamp(t, 0, duration);
    setCursor(sec);
    player.current?.seekTo(Math.round(sec * fps));
  };

  const togglePlay = () => {
    if (playing) player.current?.pause();
    else player.current?.play();
    setPlaying(v => !v);
  };

  const toggleFullscreen = async () => {
    const node = preview.current;
    if (!node) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await node.requestFullscreen();
    } catch {
      setError('Tela cheia não está disponível neste navegador.');
    }
  };

  const notify = (msg: string) => {
    setNotice(msg);
    setError('');
  };

  const upload = async (file: File): Promise<string> => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const r = await fetch('/api/upload', {
      method: 'POST',
      headers: {'x-file-extension': ext},
      body: file
    });
    const v = await r.json();
    if (!r.ok) throw Error(v.error);
    return v.src;
  };

  const openVideo = async (file?: File) => {
    if (!file) return;
    try {
      setRenderJob('Otimizando vídeo para preview e seek preciso...');
      const src = await upload(file);
      const videoDuration = await new Promise<number>((resolve, reject) => {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => {
          resolve(v.duration);
          v.remove();
        };
        v.onerror = () => reject(Error('Não foi possível ler a duração'));
        v.src = src;
      });
      const c: VideoClip = {id: uid(), src, start: 0, end: videoDuration, sourceStart: 0, speed: 1, x: 50, y: 50, zoom: 1};
      rec();
      setP(v => ({...v, clips: [c], videoSrc: '', videoDuration}));
      select({kind: 'clip', id: c.id});
      seek(0);
      notify('Vídeo otimizado para preview. A agulha pode ser movida com precisão.');
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const sourceRates = useSourceFrameRates(p);

  const chooseFrameRate = (choice: string) => {
    const mode = choice === 'source' ? 'source' : 'manual';
    const next = choice === 'source' ? (sourceRates.main?.recommendedFps ?? p.fps) : Number(choice);
    rec();
    player.current?.pause();
    setPlaying(false);
    setP(current => setProjectFrameRate(current, next, mode));
    requestAnimationFrame(() => player.current?.seekTo(Math.round(cursor * next)));
  };

  useEffect(() => {
    const next = sourceRates.main?.recommendedFps;
    if (p.exportFpsMode !== 'source' || !next || sameFps(p.fps, next)) return;
    player.current?.pause();
    setPlaying(false);
    setP(current => setProjectFrameRate(current, next, 'source'));
    requestAnimationFrame(() => player.current?.seekTo(Math.round(cursor * next)));
  }, [sourceRates.main?.src, sourceRates.main?.recommendedFps, p.exportFpsMode, p.fps]);

  const installTranscript = (incoming: Cue[]) => {
    const captions = incoming.map(c => ({...c, id: uid(), source: 'transcript' as const}));
    rec();
    setP(current => replaceTranscript(current, captions));
    setSelectedCueIds(captions.map(c => c.id));
    select(captions[0] ? {kind: 'cue', id: captions[0].id} : null);
  };

  const openSrt = async (file?: File) => {
    if (!file) return;
    try {
      const cues = parseSrt(await file.text());
      if (!cues.length) throw Error('SRT sem trechos válidos');
      installTranscript(cues);
      notify(`${cues.length} legendas na faixa Legendas geradas. Textos do projeto preservados.`);
    } catch (e) {
      setError(String(e));
    }
  };

  const openFont = async (file?: File) => {
    if (!file) return;
    try {
      const src = await upload(file);
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[^\w\s-]/g, '').trim();
      change({fonts: [...p.fonts.filter(f => f.name !== name), {name, src}]});
      notify(`Fonte ${name} importada. Selecione-a nas propriedades.`);
    } catch (e) {
      setError(String(e));
    }
  };

  const addAsset = async (file: File | undefined, kind: 'audio' | 'image') => {
    if (!file) return;
    try {
      const src = await upload(file);
      const id = uid();
      const end = kind === 'image' ? Math.min(duration, cursor + 3) : duration;
      const newLayer: Overlay = {
        id,
        kind,
        src,
        name: file.name,
        start: cursor,
        end: Math.max(cursor + 0.2, end),
        track: kind === 'audio' ? 0 : 3,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        color: '#f5c34b',
        volume: 1
      };
      change({overlays: [...p.overlays, newLayer]});
      select({kind: 'overlay', id});
      notify('Arquivo importado e adicionado à timeline.');
    } catch (e) {
      setError(String(e));
    }
  };

  const openJson = async (f?: File) => {
    if (!f) return;
    try {
      setRenderJob('Validando projeto JSON...');
      const raw = await f.text();
      if (raw.length > 12 * 1024 * 1024) throw Error('JSON muito grande (máximo de 12 MB).');
      let doc = validateProject(JSON.parse(raw));
      if (durationFrames(doc) / doc.fps > 4 * 60 * 60) {
        throw Error('Projeto excede o limite de 4 horas e não pode ser aberto na timeline.');
      }
      doc = {...doc, cues: doc.cues.map(c => ({...c, source: c.source ?? 'manual'}))};
      if (!doc.clips.length && doc.videoSrc) {
        const end = Math.max(1, doc.videoDuration || durationFrames(doc) / doc.fps);
        doc = {...doc, clips: [{id: uid(), src: doc.videoSrc, start: 0, end, sourceStart: 0, speed: 1, x: 50, y: 50, zoom: 1}], videoSrc: ''};
      }
      rec();
      setP(doc);
      setSelectedCueIds([]);
      player.current?.pause();
      setPlaying(false);
      setCursor(0);
      player.current?.seekTo(0);
      const importedClip = doc.clips[0];
      select(importedClip ? {kind: 'clip', id: importedClip.id} : {kind: 'cue', id: doc.cues[0]?.id || ''});
      notify(
        importedClip
          ? 'Projeto carregado: vídeo convertido para um clipe editável na timeline.'
          : 'Projeto carregado. Os arquivos de mídia devem continuar disponíveis em public/media.'
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const rhythmVersions = useMemo(
    () => (p.rhythmVariant ? library.filter(v => v.rhythmVariant?.groupId === p.rhythmVariant!.groupId) : []),
    [library, p.rhythmVariant?.groupId]
  );

  const persistPaceVersions = (items: ReelProject[]) => {
    setLibrary(items);
    try {
      localStorage.setItem(storage, JSON.stringify(items));
      return true;
    } catch {
      setError('As versões estão nesta sessão, mas o armazenamento está cheio. Exporte os JSONs antes de fechar.');
      return false;
    }
  };

  const analyzePace = async (objective: string) => {
    const signature = rhythmSignature(p);
    const projectId = p.id;
    setError('');
    setRenderJob('Gemini analisando gancho, ritmo e aberturas A/B...');
    try {
      const response = await fetch('/api/ai-rhythm', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({project: p, objective, model: agModel})
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'A análise de ritmo falhou.');
      if (liveProject.current.id !== projectId || rhythmSignature(liveProject.current) !== signature) {
        throw Error('O projeto mudou durante a análise. Analise novamente para usar os tempos atuais.');
      }
      if (data.analysis?.signature !== signature) {
        throw Error('A análise recebida não corresponde à timeline atual.');
      }
      rec();
      setP(current => ({...current, editorial: data.analysis as RhythmAnalysis}));
      notify('Análise de ritmo pronta. Clique nos marcadores ou escolha uma sugestão no painel.');
    } catch (error) {
      setError(String(error));
    } finally {
      setRenderJob('');
    }
  };

  const applyPace = (id: string) => {
    try {
      const next = applyRhythmSuggestion(p, id);
      rec();
      setP(next);
      if (cursor > rhythmDuration(next)) seek(rhythmDuration(next));
      notify('Sugestão aplicada. Use Desfazer para restaurar a edição anterior.');
    } catch (error) {
      setError(String(error));
    }
  };

  const ignorePace = (id: string) => {
    rec();
    setP(dismissRhythmSuggestion(p, id));
  };

  const makePaceVariants = () => {
    try {
      const variants = createRhythmVariants(p);
      const ids = new Set(variants.map(v => v.id));
      rec();
      const saved = persistPaceVersions([...variants, ...library.filter(v => !ids.has(v.id))]);
      setP(variants[0]);
      if (saved) notify('Original e versões A/B disponíveis na Biblioteca. Escolha a principal no painel Ritmo.');
    } catch (error) {
      setError(String(error));
    }
  };

  const choosePaceVersion = (version: ReelProject) => {
    try {
      const chosen = selectRhythmVersion(p, library, version.id);
      rec();
      const saved = persistPaceVersions(chosen.library);
      player.current?.pause();
      setPlaying(false);
      setP(chosen.project);
      setSelectedCueIds([]);
      select(null);
      setCursor(0);
      player.current?.seekTo(0);
      if (saved) notify('Versão ' + chosen.project.rhythmVariant?.label + ' selecionada como principal para exportar.');
    } catch (error) {
      setError(String(error));
    }
  };

  const insertCue = () => {
    const c: Cue = {
      id: uid(),
      text: addText,
      source: 'manual',
      start: cursor,
      end: Math.min(duration + 2, cursor + 2.5),
      x: 50,
      y: 70,
      track: 1,
      preset: p.preset
    };
    change({cues: [...p.cues, c]});
    select({kind: 'cue', id: c.id});
    setPanel('edit');
  };

  const addOverlay = (kind: Overlay['kind'], type?: Overlay['type']) => {
    const o: Overlay = {
      id: uid(),
      kind,
      type,
      name: type ? type : kind === 'text' ? 'Texto independente' : 'Elemento',
      text: 'SEU TEXTO',
      start: cursor,
      end: Math.max(cursor + 0.4, Math.min(duration, cursor + 2.5)),
      track: kind === 'effect' ? 4 : 3,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      color: kind === 'effect' ? '#ffffff' : '#f3c34f',
      fontA: p.fontA
    };
    change({overlays: [...p.overlays, o]});
    select({kind: 'overlay', id: o.id});
    setPanel('edit');
  };

  const deleteSelection = () => {
    if (!selected) return;
    rec();
    if (selected.kind === 'cue') setP(v => ({...v, cues: v.cues.filter(c => c.id !== selected.id)}));
    if (selected.kind === 'clip') setP(v => ({...v, clips: v.clips.filter(c => c.id !== selected.id)}));
    if (selected.kind === 'overlay') setP(v => ({...v, overlays: v.overlays.filter(c => c.id !== selected.id)}));
    if (selected.kind === 'word') {
      const c = p.cues.find(c => c.id === selected.id);
      if (c) {
        const t = normalizeWords(c).filter(w => w.id !== selected.wordId);
        setP(v => ({
          ...v,
          cues: v.cues.map(c => (c.id === selected.id ? {...c, words: t, text: t.map(w => (w.highlight ? `[${w.text}]` : w.text)).join(' ')} : c))
        }));
      }
    }
    select(null);
  };

  const duplicate = () => {
    if (!selected) return;
    const delta = 0.15;
    if (selected.kind === 'cue' && cue) {
      const c = {...clone(cue), id: uid(), start: cue.end + delta, end: cue.end + delta + (cue.end - cue.start), words: undefined};
      change({cues: [...p.cues, c]});
      select({kind: 'cue', id: c.id});
    }
    if (selected.kind === 'overlay' && overlay) {
      const o = {...clone(overlay), id: uid(), start: overlay.end + delta, end: overlay.end + delta + overlay.end - overlay.start};
      change({overlays: [...p.overlays, o]});
      select({kind: 'overlay', id: o.id});
    }
  };

  const splitClip = () => {
    if (!clip) return;
    const mid = clamp(cursor, clip.start + 1 / fps, clip.end - 1 / fps);
    if (!(mid > clip.start && mid < clip.end)) return;
    const left = {...clip, end: mid};
    const right = {...clone(clip), id: uid(), start: mid, sourceStart: clip.sourceStart + (mid - clip.start) * clip.speed};
    change({clips: p.clips.flatMap(c => (c.id === clip.id ? [left, right] : [c]))});
    select({kind: 'clip', id: right.id});
    notify('Vídeo dividido no playhead.');
  };

  const loadDemo = () => {
    rec();
    setP(clone(initialProject));
    select({kind: 'cue', id: 'demo-1'});
    seek(0);
    setPanel('edit');
    notify('Demo completo carregado. Explore os estilos, elementos, efeitos e keyframes pela timeline.');
  };

  const trimClipAtPlayhead = (side: 'left' | 'right') => {
    if (!clip) return setError('Selecione um clipe de vídeo na timeline.');
    const cut = Math.round(cursor * fps) / fps;
    if (cut <= clip.start || cut >= clip.end) return setError('Posicione o playhead dentro do clipe selecionado.');
    if (side === 'left') {
      editClip(clip.id, {start: cut, sourceStart: clip.sourceStart + (cut - clip.start) * clip.speed});
      notify('Parte à esquerda do playhead removida.');
    } else {
      editClip(clip.id, {end: cut});
      notify('Parte à direita do playhead removida.');
    }
  };

  const save = () => {
    const snapshot = clone(p);
    const next = p.rhythmVariant
      ? [snapshot, ...library.filter(v => v.id !== p.id)]
      : [{...snapshot, id: uid()}, ...library].slice(0, 35);
    if (persistPaceVersions(next)) notify('Projeto salvo na biblioteca deste navegador. Faça backup com Exportar JSON.');
  };

  const saveKit = () => {
    const b: BrandKit = {
      id: uid(),
      name: kitName,
      fontA: p.fontA,
      fontB: p.fontB,
      twoFonts: p.twoFonts,
      background: p.background,
      foreground: p.foreground,
      accent: p.accent,
      creativity: p.creativity
    };
    const next = [b, ...brandKits].slice(0, 30);
    setBrandKits(next);
    localStorage.setItem(kitsStore, JSON.stringify(next));
    notify('Identidade visual salva. Presets individuais continuam independentes.');
  };

  const useKit = (b: BrandKit) => {
    change({
      fontA: b.fontA,
      fontB: b.fontB,
      twoFonts: b.twoFonts,
      background: b.background,
      foreground: b.foreground,
      accent: b.accent,
      creativity: b.creativity
    });
    if (cue && selectedCueIds.length > 1 && applyToAllSelected) {
      editCue(cue.id, {
        fontA: b.fontA,
        fontB: b.fontB,
        twoFonts: b.twoFonts,
        foreground: b.foreground,
        accent: b.accent
      });
    }
    notify('Identidade aplicada como padrão do projeto' + (cue && selectedCueIds.length > 1 && applyToAllSelected ? ' e às legendas selecionadas.' : '.'));
  };

  const startJob = async (project: ReelProject, callback?: (url: string) => void) => {
    const r = await fetch('/api/render', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({project})
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error);
    const id = data.id;

    for (let n = 0; n < 3600; n++) {
      await new Promise(resolve => setTimeout(resolve, 1300));
      const j = await (await fetch('/api/render/' + id)).json();
      setRenderJob(j.message || 'Renderizando...');
      if (j.state === 'done') {
        callback?.(j.url);
        return j.url as string;
      }
      if (j.state === 'error') throw Error(j.message);
    }
    throw Error('Render excedeu o tempo limite');
  };

  const openTemplateVersion = (project: ReelProject) => {
    rec();
    player.current?.pause();
    setPlaying(false);
    select(null);
    setSelectedCueIds([]);
    setP(clone(project));
    setCursor(0);
    player.current?.seekTo(0);
    notify('Versão aberta como cópia independente.');
  };

  const saveTemplateVersions = (projects: ReelProject[]) => {
    const ids = new Set(projects.map(v => v.id));
    return persistPaceVersions([...projects, ...library.filter(v => !ids.has(v.id))]);
  };

  const renderTemplateVersion = async (project: ReelProject) => {
    setRenderJob('Preparando versão: ' + project.name);
    try {
      return await startJob(project);
    } finally {
      setRenderJob('');
    }
  };

  const exportMp4 = async () => {
    setError('');
    setRenderJob('Preparando renderização MP4...');
    setOut('');
    try {
      const url = await startJob(p);
      setOut(url);
      notify('MP4 renderizado com legendas, camadas e cortes.');
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const batchRender = async () => {
    if (!library.length) return setError('Salve projetos na biblioteca para exportação em lote.');
    setBatchFiles([]);
    setRenderJob('Iniciando lote...');
    try {
      const outs: string[] = [];
      for (let i = 0; i < library.length; i++) {
        setRenderJob(`Renderizando ${i + 1}/${library.length}: ${library[i].name}`);
        const file = await startJob(library[i]);
        outs.push(file);
        setBatchFiles([...outs]);
      }
      notify(`${outs.length} vídeos renderizados.`);
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const reviewGeneratedCaptions = async (cues: Cue[], src: string) => {
    try {
      setRenderJob('Gemini revisando texto, tempos e destaques...');
      const r = await fetch('/api/ai-caption-review', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({cues, src, model: agModel})
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      return Array.isArray(data.cues) && data.cues.length === cues.length ? (data.cues as Cue[]) : cues;
    } catch (e) {
      setNotice('Transcrição criada; a revisão Gemini não respondeu. Você pode tentar Revisar legendas.');
      return cues;
    }
  };

  const applyGeneratedCaptions = async (raw: Cue[], src: string) => {
    if (!raw.length) throw Error('Nenhum trecho transcrito');
    const reviewed = await reviewGeneratedCaptions(raw, src);
    installTranscript(reviewed);
  };

  const jobPoll = async (id: string, kind: 'transcribe' | 'words', src: string) => {
    for (let i = 0; i < 1800; i++) {
      await new Promise(done => setTimeout(done, 1000));
      const j = await (await fetch('/api/render/' + id)).json();
      setRenderJob(j.message);
      if (j.state === 'done') {
        if (kind === 'transcribe') await applyGeneratedCaptions(parseSrt(await (await fetch(j.url)).text()), src);
        if (kind === 'words') {
          const data = await (await fetch(j.url)).json();
          if (!Array.isArray(data.cues)) throw Error('Nenhuma palavra sincronizada');
          await applyGeneratedCaptions(data.cues, src);
        }
        return;
      }
      if (j.state === 'error') throw Error(j.message);
    }
  };

  const transcribe = async () => {
    const src = p.clips[0]?.src || p.videoSrc || p.overlays.find(o => o.kind === 'audio')?.src;
    if (!src) return setError('Importe um vídeo ou áudio antes.');
    setError('');
    setRenderJob('Iniciando Whisper local...');
    try {
      const r = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({src, model, language: 'Portuguese'})
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await jobPoll(d.id, 'transcribe', src);
      notify('Legendas geradas, revisadas e selecionadas. Elementos existentes foram preservados.');
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const transcribeWords = async () => {
    const src = p.clips[0]?.src || p.videoSrc || p.overlays.find(o => o.kind === 'audio')?.src;
    if (!src) return setError('Importe vídeo ou áudio primeiro.');
    setRenderJob('Sincronizando palavras com faster-whisper...');
    setError('');
    try {
      const r = await fetch('/api/transcribe-words', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({src, model})
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await jobPoll(d.id, 'words', src);
      notify('Legendas por palavra foram revisadas e selecionadas. Elementos existentes foram preservados.');
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const suggestStyles = async () => {
    if (!transcriptCues.length) return setError('Gere ou importe legendas antes de pedir estilos à IA.');
    setError('');
    setRenderJob('Gemini sugerindo estilos para a faixa de legendas...');
    try {
      const r = await fetch('/api/ai-style', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({cues: transcriptCues, model: agModel})
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      if (!Array.isArray(data.presets) || data.presets.length !== transcriptCues.length) {
        throw Error('A IA não retornou uma sequência válida');
      }
      const styles = new Map(transcriptCues.map((c, i) => [c.id, data.presets[i]]));
      rec();
      setP(current => ({
        ...current,
        cues: current.cues.map(c => (isTranscript(c) && PRESETS.includes(styles.get(c.id)) ? {...c, preset: styles.get(c.id)} : c))
      }));
      notify('Estilos aplicados somente às legendas geradas.');
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const smartStyle = () => {
    const types = ['editorial', 'impact', 'word-by-word', 'marker', 'slide-side', 'handwritten-mix', 'scribble-highlight', 'pop', 'magazine', 'kinetic'] as Preset[];
    change({
      cues: p.cues.map((c, i) =>
        isTranscript(c)
          ? {...c, preset: /\d|%|R\$/.test(c.text) ? 'impact' : /\[[^\]]+\]/.test(c.text) ? 'marker' : types[i % types.length]}
          : c
      )
    });
    notify('Sugestões por regras aplicadas (sem IA). Você pode ajustar cada legenda.');
  };

  const addKeyframe = () => {
    if (!selected || selected.kind === 'word') return;
    const item = cue || overlay || clip;
    if (!item) return;
    const x = (item as any).x ?? 50;
    const y = (item as any).y ?? 50;
    const scale = (item as any).scale ?? (item as VideoClip).zoom ?? 1;
    const rotation = (item as any).rotation ?? 0;
    const opacity = (item as any).opacity ?? 1;
    const k: Keyframe = {time: cursor, x, y, scale, rotate: rotation, opacity};
    const keyframes = [...((item as any).keyframes || []).filter((v: Keyframe) => Math.abs(v.time - cursor) > 1 / fps), k].sort((a, b) => a.time - b.time);
    if (cue) editCue(cue.id, {keyframes});
    if (overlay) editLayer(overlay.id, {keyframes});
    if (clip) editClip(clip.id, {keyframes});
    notify('Keyframe adicionado no tempo ' + seconds(cursor));
  };

  const applyPosition = (x: number, y: number, undo = false) => {
    if (!selected) return;
    const patch = {x: clamp(x, 0, 100), y: clamp(y, 0, 100)};
    const moveCaptionGroup = selected.kind === 'cue' && selectedCueIds.length > 1 && selectedCueIds.includes(selected.id);
    if (moveCaptionGroup) {
      const origins = captionPreviewOrigins.current ?? (captionPreviewOrigins.current = p.cues.filter(item => selectedCueIds.includes(item.id)).map(clone));
      const anchor = origins.find(item => item.id === selected.id);
      const dx = patch.x - (anchor?.x ?? 50);
      const dy = patch.y - (anchor?.y ?? 70);
      if (undo) rec();
      setP(current => ({
        ...current,
        cues: current.cues.map(item => {
          const origin = origins.find(v => v.id === item.id);
          return origin ? {...item, x: clamp((origin.x ?? 50) + dx, 0, 100), y: clamp((origin.y ?? 70) + dy, 0, 100)} : item;
        })
      }));
      return;
    }
    if (keyframeMode && selected.kind !== 'word') {
      const item = cue || overlay || clip;
      if (!item) return;
      const prev = (item.keyframes || []).filter(k => Math.abs(k.time - cursor) > 1 / fps);
      const key: Keyframe = {time: cursor, ...patch};
      if (cue) editCue(cue.id, {keyframes: [...prev, key].sort((a, b) => a.time - b.time)}, undo);
      if (overlay) editLayer(overlay.id, {keyframes: [...prev, key].sort((a, b) => a.time - b.time)}, undo);
      if (clip) editClip(clip.id, {keyframes: [...prev, key].sort((a, b) => a.time - b.time)}, undo);
    } else {
      if (cue) editCue(cue.id, patch, undo);
      if (overlay) editLayer(overlay.id, patch, undo);
      if (clip) editClip(clip.id, patch, undo);
    }
  };

  const onTimelinePointer = (e: RPointerEvent<HTMLElement>, kind: Drag['kind'], id: string, mode: Drag['mode'], wordId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const c = kind === 'cue' ? p.cues.find(x => x.id === id) : kind === 'clip' ? p.clips.find(x => x.id === id) : kind === 'overlay' ? p.overlays.find(x => x.id === id) : normalizeWords(p.cues.find(x => x.id === id)!).find(w => w.id === wordId);
    if (!c) return;
    rec();
    const group = kind === 'cue' && mode === 'move' && selectedCueIds.includes(id) && selectedCueIds.length > 1
      ? p.cues.filter(x => selectedCueIds.includes(x.id) && isTranscript(x) === isTranscript(c as Cue)).map(clone)
      : undefined;
    drag.current = {kind, id, wordId, mode, startX: e.clientX, original: clone(c), group};
    select({kind, id, wordId});
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onTimelineMove = (e: RPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const delta = Math.round(((e.clientX - d.startX) / zoom) * fps) / fps;
    const c = d.original;
    if (d.group) {
      const shift = Math.max(-Math.min(...d.group.map(q => q.start)), delta);
      const originals = new Map(d.group.map(q => [q.id, q]));
      setP(current => ({
        ...current,
        cues: current.cues.map(q => {
          const original = originals.get(q.id);
          return original ? {...q, start: original.start + shift, end: original.end + shift} : q;
        })
      }));
      return;
    }
    let start = Math.max(0, c.start + (d.mode === 'end' ? 0 : delta));
    let end = Math.max(start + 1 / fps, c.end + (d.mode === 'start' ? 0 : delta));

    let didSnap = false;
    let snapTarget = 0;
    if (snapEnabled) {
      const threshold = 10 / zoom;
      const marks = [
        0,
        duration,
        cursor,
        ...p.clips.filter(v => v.id !== d.id).flatMap(v => [v.start, v.end]),
        ...p.cues.filter(v => v.id !== d.id).flatMap(v => [v.start, v.end]),
        ...p.overlays.filter(v => v.id !== d.id).flatMap(v => [v.start, v.end])
      ];
      const snap = (v: number) => marks.reduce((best, m) => (Math.abs(m - v) < Math.abs(best - v) ? m : best), v);
      if (d.mode === 'move') {
        const target = snap(start);
        if (Math.abs(target - start) <= threshold) {
          end += target - start;
          start = target;
          didSnap = true;
          snapTarget = target;
        }
      } else if (d.mode === 'start') {
        const target = snap(start);
        if (Math.abs(target - start) <= threshold) {
          start = target;
          didSnap = true;
          snapTarget = target;
        }
      } else {
        const target = snap(end);
        if (Math.abs(target - end) <= threshold) {
          end = target;
          didSnap = true;
          snapTarget = target;
        }
      }
    }
    setSnapLine(didSnap ? snapTarget : null);
    const update = d.mode === 'move' ? {start, end} : d.mode === 'start' ? {start: Math.min(c.end - 1 / fps, start)} : {end};
    if (d.kind === 'cue') editCue(d.id, update, false);
    if (d.kind === 'overlay') editLayer(d.id, update, false);
    if (d.kind === 'clip') {
      const v = {...update};
      if (d.mode === 'start') Object.assign(v, {sourceStart: c.sourceStart + Math.max(0, start - c.start) * c.speed});
      editClip(d.id, v, false);
    }
    if (d.kind === 'word' && d.wordId) editWord(d.id, d.wordId, update, false);
  };

  const onPointerEnd = () => {
    setSnapLine(null);
    drag.current = null;
    posDrag.current = null;
    captionPreviewOrigins.current = null;
  };

  const scrubTimeline = (e: RPointerEvent<HTMLElement>) => {
    const canvas = e.currentTarget.parentElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    seek((e.clientX - rect.left) / zoom);
  };

  const startScrub = (e: RPointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    scrubbing.current = true;
    scrubTimeline(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveScrub = (e: RPointerEvent<HTMLElement>) => {
    if (scrubbing.current) scrubTimeline(e);
  };

  const endScrub = () => {
    scrubbing.current = false;
  };

  const startResize = (kind: 'left' | 'right' | 'timeline') => (e: RPointerEvent<HTMLElement>) => {
    e.preventDefault();
    resize.current = {
      kind,
      start: kind === 'timeline' ? e.clientY : e.clientX,
      size: kind === 'left' ? leftWidth : kind === 'right' ? rightWidth : timelineHeight
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const resizeMove = (e: RPointerEvent<HTMLElement>) => {
    const r = resize.current;
    if (!r) return;
    const delta = (r.kind === 'timeline' ? e.clientY : e.clientX) - r.start;
    if (r.kind === 'left') setLeftWidth(clamp(r.size + delta, LEFT_PANEL_MIN, LEFT_PANEL_MAX));
    if (r.kind === 'right') setRightWidth(clamp(r.size - delta, RIGHT_PANEL_MIN, RIGHT_PANEL_MAX));
    if (r.kind === 'timeline') setTimelineHeight(clamp(r.size - delta, 180, 620));
  };

  const stopResize = () => {
    resize.current = null;
  };

  const autoZoom = () => {
    const c = clip || p.clips[0];
    if (!c) return setError('Importe um vídeo primeiro.');
    const marks: Keyframe[] = [];
    for (const q of p.cues) {
      if (q.start < c.start || q.start > c.end) continue;
      const mx = Math.min(q.end - 0.07, q.start + 0.23);
      const end = Math.min(q.end, c.end);
      marks.push(
        {time: q.start, x: 50, y: 50, scale: 1},
        {time: mx, x: 50, y: 50, scale: /\[[^\]]+\]/.test(q.text) ? 1.19 : 1.1},
        {time: end, x: 50, y: 50, scale: 1}
      );
    }
    if (!marks.length) return setError('Adicione legendas para sugerir os zooms');
    editClip(c.id, {keyframes: marks.sort((a, b) => a.time - b.time)});
    notify(`Zooms automáticos aplicados em ${p.cues.length} trechos; revise na prévia.`);
  };

  const suggestGeminiFraming = async () => {
    const c = clip || p.clips[0];
    if (!c) return setError('Importe ou selecione um vídeo para sugerir enquadramento.');
    setError('');
    setRenderJob('Gemini via AG Local Bridge sugerindo enquadramento...');
    try {
      const r = await fetch('/api/ai-framing', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({cues: p.cues, start: c.start, end: c.end, model: agModel})
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      const keyframes = (data.keyframes || []).map((k: any) => ({
        time: k.time,
        x: clamp(k.x, 0, 100),
        y: clamp(k.y, 0, 100),
        scale: clamp(k.scale, 1, 1.22)
      }));
      if (!keyframes.length) throw Error('Gemini não sugeriu pontos de enquadramento para este trecho.');
      editClip(c.id, {keyframes});
      notify(`Gemini adicionou ${keyframes.length} keyframes de enquadramento. Revise no preview.`);
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const improveWithAi = async () => {
    if (!p.clips.length) return setError('Importe um vídeo antes de aplicar cortes com IA.');
    if (!transcriptCues.length) return setError('Importe ou gere uma transcrição antes de usar a IA.');
    setError('');
    setAiSummary('');
    setRenderJob('AG Local Bridge analisando a edição...');
    try {
      const r = await fetch('/api/ai-improve', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({cues: transcriptCues, prompt: aiPrompt, model: agModel})
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error || 'A IA não retornou uma análise válida');
      const rawCuts = (Array.isArray(result.cuts) ? result.cuts : [])
        .map((c: any) => ({
          start: clamp(Number(c.start), 0, duration),
          end: clamp(Number(c.end), 0, duration),
          reason: String(c.reason || 'Trecho removido')
        }))
        .filter((c: any) => c.end - c.start >= 0.08)
        .sort((a: any, b: any) => a.start - b.start);
      const cuts = rawCuts.reduce((all: any[], cut: any) => {
        const last = all[all.length - 1];
        if (last && cut.start <= last.end + 0.04) last.end = Math.max(last.end, cut.end);
        else all.push({...cut});
        return all;
      }, []);
      const rewrites = new Map<string, string>((Array.isArray(result.rewrites) ? result.rewrites : []).map((x: any) => [String(x.id), String(x.text)]));
      const removedBefore = (time: number) => cuts.reduce((sum: number, c: any) => sum + (time >= c.end ? c.end - c.start : time > c.start ? time - c.start : 0), 0);
      const mapTime = (time: number) => Math.max(0, time - removedBefore(time));
      const overlaps = (a: number, b: number) => cuts.some((c: any) => c.start < b && c.end > a);
      const clips = p.clips.flatMap(c => {
        let at = c.start;
        const pieces: VideoClip[] = [];
        for (const cut of cuts) {
          if (cut.end <= at || cut.start >= c.end) continue;
          const end = Math.min(c.end, cut.start);
          if (end - at >= 1 / fps) {
            pieces.push({
              ...clone(c),
              id: pieces.length ? uid() : c.id,
              start: mapTime(at),
              end: mapTime(end),
              sourceStart: c.sourceStart + (at - c.start) * c.speed
            });
          }
          at = Math.max(at, cut.end);
        }
        if (c.end - at >= 1 / fps) {
          pieces.push({
            ...clone(c),
            id: pieces.length ? uid() : c.id,
            start: mapTime(at),
            end: mapTime(c.end),
            sourceStart: c.sourceStart + (at - c.start) * c.speed
          });
        }
        return pieces;
      });
      const cues = p.cues
        .filter(c => !isTranscript(c) || !overlaps(c.start, c.end))
        .map(c =>
          isTranscript(c)
            ? {...c, start: mapTime(c.start), end: mapTime(c.end), text: rewrites.get(c.id) ?? c.text, words: undefined}
            : {...c, start: mapTime(c.start), end: Math.max(mapTime(c.start) + 1 / fps, mapTime(c.end))}
        );
      const overlays = p.overlays.map(o => ({...o, start: mapTime(o.start), end: Math.max(mapTime(o.start) + 1 / fps, mapTime(o.end))}));
      rec();
      setP({...p, clips, cues, overlays, videoDuration: Math.max(1, ...clips.map(c => c.end))});
      if (clips[0]) select({kind: 'clip', id: clips[0].id});
      setAiSummary(`${result.summary || 'Edição melhorada.'} ${cuts.length} corte(s) aplicado(s); ${rewrites.size} legenda(s) revisada(s).`);
      notify('Melhorias da IA aplicadas. Revise os cortes antes de exportar.');
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const cutSilences = async () => {
    const c = clip || p.clips[0];
    if (!c) return setError('Importe um vídeo para detectar pausas');
    if (p.clips.length !== 1 || c.sourceStart !== 0 || c.start !== 0 || c.speed !== 1) {
      return setError('Corte automático é aplicado em um vídeo ainda não editado. Faça backup e use o vídeo original.');
    }
    setRenderJob('Analisando pausas com FFmpeg...');
    try {
      const r = await fetch('/api/silences', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({src: c.src, duration: c.end - c.start})
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error);
      let silences: {start: number; end: number}[] = [];
      for (let i = 0; i < 300; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const status = await (await fetch('/api/render/' + j.id)).json();
        if (status.state === 'error') throw Error(status.message);
        if (status.state === 'done') {
          silences = status.silences || [];
          break;
        }
      }
      const minimum = 0.12,
        gap = 0.1;
      const keep: {start: number; end: number}[] = [];
      let at = 0;
      for (const silence of silences) {
        const begin = clamp(silence.start + gap, 0, c.end);
        const finish = clamp(silence.end - gap, 0, c.end);
        if (begin > at + minimum) keep.push({start: at, end: begin});
        at = Math.max(at, finish);
      }
      if (c.end - at > minimum) keep.push({start: at, end: c.end});
      if (!keep.length) throw Error('Nenhum intervalo de fala encontrado');
      let pos = 0;
      const pieces = keep.map(k => {
        const piece: VideoClip = {
          ...clone(c),
          id: uid(),
          start: pos,
          end: pos + (k.end - k.start),
          sourceStart: k.start,
          keyframes: []
        };
        pos = piece.end;
        return piece;
      });
      const mapTime = (t: number) => {
        let output = 0;
        for (const k of keep) {
          if (t < k.start) return output;
          if (t <= k.end) return output + t - k.start;
          output += k.end - k.start;
        }
        return output;
      };
      const remap = (a: number, b: number) => ({start: mapTime(a), end: mapTime(b)});
      const cues = p.cues
        .map(q => ({...q, ...remap(q.start, q.end), words: undefined}))
        .filter(q => !isTranscript(q) || q.end - q.start > minimum)
        .map(q => ({...q, end: Math.max(q.start + 1 / fps, q.end)}));
      const overlays = p.overlays.map(o => ({...o, start: mapTime(o.start), end: Math.max(mapTime(o.start) + 1 / fps, mapTime(o.end))}));
      change({clips: pieces, cues, overlays, videoDuration: pos});
      notify(`${pieces.length} blocos de fala. ${seconds(c.end - pos)} de silêncio removido; tempos de legendas remapeados.`);
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const faceReframe = async () => {
    const c = clip || p.clips[0];
    if (!c) return setError('Importe ou selecione um vídeo');
    const detector = (window as any).FaceDetector ? new (window as any).FaceDetector({fastMode: true, maxDetectedFaces: 1}) : null;
    if (!detector) {
      return setError('A API FaceDetector não está ativa neste navegador. Crie keyframes de enquadramento manualmente ou use a sugestão via Gemini.');
    }
    setRenderJob('Detectando posições do rosto ao longo do trecho...');
    try {
      const vid = document.createElement('video');
      vid.src = c.src;
      vid.muted = true;
      await new Promise<void>((resolve, reject) => {
        vid.onloadedmetadata = () => resolve();
        vid.onerror = () => reject(Error('Vídeo inacessível'));
      });
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 270;
      const context = canvas.getContext('2d')!;
      const k: Keyframe[] = [];
      const step = 0.5;
      for (let t = c.start; t <= c.end; t += step) {
        vid.currentTime = c.sourceStart + (t - c.start) * c.speed;
        await new Promise<void>(resolve => {
          vid.onseeked = () => resolve();
        });
        context.drawImage(vid, 0, 0, 480, 270);
        const faces = await detector.detect(canvas);
        if (faces.length) {
          const bb = faces[0].boundingBox;
          k.push({
            time: t,
            x: clamp(((bb.x + bb.width / 2) / 480) * 100, 10, 90),
            y: clamp(((bb.y + bb.height / 2) / 270) * 100, 10, 90),
            scale: 1.15
          });
        }
      }
      if (!k.length) throw Error('Nenhum rosto detectado');
      editClip(c.id, {keyframes: k});
      notify(`${k.length} keyframes de rosto adicionados (revise o enquadramento).`);
    } catch (e) {
      setError(String(e));
    } finally {
      setRenderJob('');
    }
  };

  const analyzeAudio = async (f?: File) => {
    if (!f) return;
    try {
      const src = await upload(f);
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const audio = await ctx.decodeAudioData((await f.arrayBuffer()).slice(0));
      const channel = audio.getChannelData(0);
      const windowSize = Math.round(audio.sampleRate * 0.12);
      const energy: number[] = [];
      for (let i = 0; i < channel.length; i += windowSize) {
        let sum = 0;
        for (let j = i; j < Math.min(i + windowSize, channel.length); j++) sum += channel[j] * channel[j];
        energy.push(Math.sqrt(sum / windowSize));
      }
      const avg = energy.reduce((a, b) => a + b, 0) / (energy.length || 1);
      const peaks: number[] = [];
      for (let i = 1; i < energy.length - 1; i++) {
        if (energy[i] > avg * 1.7 && energy[i] > energy[i - 1] && energy[i] >= energy[i + 1] && (!peaks.length || i * 0.12 - peaks[peaks.length - 1] > 0.35)) {
          peaks.push(i * 0.12);
        }
      }
      const beats = peaks.slice(0, 150).map(
        t =>
          ({
            id: uid(),
            kind: 'effect',
            type: 'flash',
            name: 'Beat flash',
            start: t,
            end: t + 0.17,
            track: 4,
            x: 50,
            y: 50,
            scale: 1,
            rotation: 0,
            opacity: 0.13,
            color: '#ffffff'
          } as Overlay)
      );
      change({
        overlays: [
          ...p.overlays,
          {
            id: uid(),
            kind: 'audio',
            name: f.name,
            src,
            start: 0,
            end: audio.duration,
            track: 0,
            x: 50,
            y: 50,
            scale: 1,
            rotation: 0,
            opacity: 1,
            volume: 1
          },
          ...beats
        ]
      });
      await ctx.close();
      notify(`Áudio e ${beats.length} pulsos de batida adicionados. Ajuste pela timeline.`);
    } catch (e) {
      setError('Não foi possível analisar este áudio: ' + String(e));
    }
  };

  useShortcuts({
    onSelectAllCaptions: () => {
      setSelectedCueIds(transcriptCues.map(c => c.id));
      if (transcriptCues[0]) select({kind: 'cue', id: transcriptCues[0].id});
    },
    onUndo: undo,
    onRedo: redo,
    onDuplicate: duplicate,
    onTogglePlay: togglePlay,
    onDelete: deleteSelection
  });

  return (
    <div
      className="studioV6"
      style={
        {
          '--left-panel': `${leftWidth}px`,
          '--right-panel': `${rightWidth}px`,
          '--timeline-height': `${timelineHeight}px`
        } as React.CSSProperties
      }
    >
      <Topbar
        project={p}
        renderJob={renderJob}
        onAnalyzeRhythm={() => setPanel('rhythm')}
        onLoadDemo={loadDemo}
        onPickVideo={() => pickerVideo.current?.click()}
        onPickSrt={() => pickerSrt.current?.click()}
        onPickAudio={() => pickerAudio.current?.click()}
        onPickImage={() => pickerImage.current?.click()}
        onPickFont={() => pickerFont.current?.click()}
        onSave={save}
        onExportMp4={exportMp4}
      />

      <input hidden type="file" accept="video/*,.mov" ref={pickerVideo} onChange={e => openVideo(e.target.files?.[0])} />
      <input hidden type="file" accept=".srt" ref={pickerSrt} onChange={e => openSrt(e.target.files?.[0])} />
      <input hidden type="file" accept=".woff,.woff2,.ttf,.otf" ref={pickerFont} onChange={e => openFont(e.target.files?.[0])} />
      <input hidden type="file" accept="image/*" ref={pickerImage} onChange={e => addAsset(e.target.files?.[0], 'image')} />
      <input hidden type="file" accept="audio/*" ref={pickerAudio} onChange={e => addAsset(e.target.files?.[0], 'audio')} />
      <input hidden type="file" accept=".json" ref={pickerJson} onChange={e => openJson(e.target.files?.[0])} />

      <div className="editorGrid">
        <aside className="leftPanel">
          <div className="tabs">
            {(['edit', 'styles', 'effects', 'rhythm', 'ai', 'templates', 'library'] as const).map(v => (
              <button key={v} className={panel === v ? 'chosen' : ''} onClick={() => setPanel(v)}>
                {
                  ({
                    edit: 'Editar',
                    styles: 'Estilos',
                    effects: 'Elementos',
                    rhythm: 'Ritmo',
                    ai: 'IA',
                    templates: 'Templates',
                    library: 'Biblioteca'
                  })[v]
                }
              </button>
            ))}
          </div>

          {panel === 'edit' && (
            <EditPanel
              project={p}
              selected={selected}
              selectedCueIds={selectedCueIds}
              applyToAllSelected={applyToAllSelected}
              onSetApplyToAllSelected={setApplyToAllSelected}
              cue={cue}
              word={word}
              overlay={overlay}
              clip={clip}
              fonts={fonts}
              cursor={cursor}
              keyframeMode={keyframeMode}
              renderJob={renderJob}
              onSelect={select}
              onEditCue={editCue}
              onEditWord={editWord}
              onEditLayer={editLayer}
              onEditClip={editClip}
              onSplitClip={splitClip}
              onFaceReframe={faceReframe}
              onAutoZoom={autoZoom}
              onCutSilences={cutSilences}
              onSetKeyframeMode={setKeyframeMode}
              onAddKeyframe={addKeyframe}
              onDuplicate={duplicate}
              onDeleteSelection={deleteSelection}
            />
          )}

          {panel === 'styles' && (
            <StylesPanel
              project={p}
              cue={cue}
              selectedCueIds={selectedCueIds}
              applyToAllSelected={applyToAllSelected}
              onSetApplyToAllSelected={setApplyToAllSelected}
              onSelectPreset={pr => {
                if (cue) editCue(cue.id, {preset: pr});
                else change({preset: pr});
              }}
              onChangeProject={change}
              kitName={kitName}
              onSetKitName={setKitName}
              brandKits={brandKits}
              onSaveKit={saveKit}
              onUseKit={useKit}
            />
          )}

          {panel === 'effects' && (
            <EffectsPanel
              addText={addText}
              onSetAddText={setAddText}
              onAddOverlay={addOverlay}
              onPickImage={() => pickerImage.current?.click()}
              onInsertCue={insertCue}
              onAnalyzeAudio={analyzeAudio}
            />
          )}

          <div style={{display: panel === 'rhythm' ? 'block' : 'none'}}>
            <RhythmPanel
              project={p}
              busy={!!renderJob}
              versions={rhythmVersions}
              focusId={focusedRhythm}
              onAnalyze={analyzePace}
              onApply={applyPace}
              onDismiss={ignorePace}
              onCreateVariants={makePaceVariants}
              onChooseVersion={choosePaceVersion}
              onSeek={seek}
            />
          </div>

          {panel === 'ai' && (
            <AiPanel
              agModel={agModel}
              onSetAgModel={setAgModel}
              aiPrompt={aiPrompt}
              onSetAiPrompt={setAiPrompt}
              aiSummary={aiSummary}
              renderJob={renderJob}
              hasCues={!!p.cues.length}
              model={model}
              onSetModel={setModel}
              onImproveWithAi={improveWithAi}
              onTranscribe={transcribe}
              onTranscribeWords={transcribeWords}
              onSuggestStyles={suggestStyles}
              onSmartStyle={smartStyle}
              onSuggestGeminiFraming={suggestGeminiFraming}
              onFaceReframe={faceReframe}
              onAutoZoom={autoZoom}
              onCutSilences={cutSilences}
            />
          )}

          <TemplatesPanel
            project={p}
            cursor={cursor}
            hidden={panel !== 'templates'}
            busy={!!renderJob}
            progress={renderJob}
            fonts={fonts}
            onOpenProject={openTemplateVersion}
            onSaveProjects={saveTemplateVersions}
            onUpload={upload}
            onRenderProject={renderTemplateVersion}
          />

          {panel === 'library' && (
            <LibraryPanel
              library={library}
              project={p}
              renderJob={renderJob}
              batchFiles={batchFiles}
              onSave={save}
              onOpenProject={v => {
                rec();
                setP(clone(v));
                notify('Projeto restaurado.');
              }}
              onDeleteProject={id => {
                const lib = library.filter(x => x.id !== id);
                setLibrary(lib);
                localStorage.setItem(storage, JSON.stringify(lib));
              }}
              onPickJson={() => pickerJson.current?.click()}
              onBatchRender={batchRender}
            />
          )}
        </aside>

        <div
          className="panelResizer vertical"
          title="Arraste para ajustar o painel esquerdo"
          onPointerDown={startResize('left')}
          onPointerMove={resizeMove}
          onPointerUp={stopResize}
          onLostPointerCapture={stopResize}
        />

        <PreviewStage
          project={p}
          fps={fps}
          duration={duration}
          cursor={cursor}
          playing={playing}
          playerRef={player}
          previewRef={preview}
          previewStageRef={previewStage}
          safeZone={safeZone}
          onSetSafeZone={setSafeZone}
          safeTarget={safeTarget}
          onSetSafeTarget={setSafeTarget}
          selected={selected}
          cue={cue}
          overlay={overlay}
          clip={clip}
          onSeek={seek}
          onTogglePlay={togglePlay}
          onToggleFullscreen={toggleFullscreen}
          onPositionStart={e => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            rec();
            posDrag.current = {
              startX: e.clientX,
              startY: e.clientY,
              originX: cue?.x ?? overlay?.x ?? clip?.x ?? 50,
              originY: cue?.y ?? overlay?.y ?? clip?.y ?? (clip ? 50 : 70)
            };
          }}
          onPositionMove={e => {
            const d = posDrag.current;
            const rect = previewStage.current?.getBoundingClientRect();
            if (!d || !rect) return;
            applyPosition(d.originX + ((e.clientX - d.startX) / rect.width) * 100, d.originY + ((e.clientY - d.startY) / rect.height) * 100, false);
          }}
          onPositionEnd={onPointerEnd}
          sourceRates={sourceRates}
          onChooseFrameRate={chooseFrameRate}
          onChangeProject={change}
          onUndo={undo}
          onRedo={redo}
          notice={notice}
          error={error}
          renderJob={renderJob}
          out={out}
        />

        <div
          className="panelResizer vertical"
          title="Arraste para ajustar o painel direito"
          onPointerDown={startResize('right')}
          onPointerMove={resizeMove}
          onPointerUp={stopResize}
          onLostPointerCapture={stopResize}
        />

        <SidebarRight
          project={p}
          clip={clip}
          cue={cue}
          sourceRates={sourceRates}
          onUseSourceFps={() => chooseFrameRate('source')}
          onSplitClip={splitClip}
          onTrimClipAtPlayhead={trimClipAtPlayhead}
          snapEnabled={snapEnabled}
          onSetSnapEnabled={setSnapEnabled}
          wordExpanded={wordExpanded}
          onToggleWordExpanded={() => setWordExpanded(v => !v)}
          onSplitCueWords={() => {
            if (cue) {
              editCue(cue.id, {words: splitWords(cue)});
              setWordExpanded(true);
              notify('Palavras separadas e sincronizadas proporcionalmente.');
            }
          }}
        />
      </div>

      <div
        className="panelResizer horizontal"
        title="Arraste para ajustar a altura da timeline"
        onPointerDown={startResize('timeline')}
        onPointerMove={resizeMove}
        onPointerUp={stopResize}
        onLostPointerCapture={stopResize}
      />

      <Timeline
        project={p}
        timelineRef={timeline}
        duration={duration}
        zoom={zoom}
        onSetZoom={setZoom}
        cursor={cursor}
        onSeek={seek}
        transcriptCuesCount={transcriptCues.length}
        onSelectAllCaptions={() => {
          setSelectedCueIds(transcriptCues.map(c => c.id));
          if (transcriptCues[0]) select({kind: 'cue', id: transcriptCues[0].id});
        }}
        onFocusRhythm={id => {
          setFocusedRhythm(id);
          setPanel('rhythm');
        }}
        onDown={onTimelinePointer}
        onMove={onTimelineMove}
        onEnd={onPointerEnd}
        onSelectClip={(kind, id, wordId, start, additive) => {
          if (kind === 'cue') {
            setSelectedCueIds(current => {
              const target = p.cues.find(c => c.id === id);
              const sameTrack = current.filter(cueId => {
                const item = p.cues.find(c => c.id === cueId);
                return item && target && isTranscript(item) === isTranscript(target);
              });
              return additive
                ? sameTrack.includes(id)
                  ? sameTrack.filter(cueId => cueId !== id)
                  : [...sameTrack, id]
                : sameTrack.includes(id)
                ? sameTrack
                : [id];
            });
          }
          select({kind, id, wordId});
          seek(start);
          setPanel('edit');
        }}
        selected={selected}
        selectedCueIds={selectedCueIds}
        cue={cue}
        wordExpanded={wordExpanded}
        startScrub={startScrub}
        moveScrub={moveScrub}
        endScrub={endScrub}
        snapLine={snapLine}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<ProjectStudio />);
