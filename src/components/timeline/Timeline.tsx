import React, {useMemo, type PointerEvent as RPointerEvent} from 'react';
import type {Cue, ReelProject} from '../../lib/project';
import {cueTracks, normalizeWords} from '../../lib/project';
import {rhythmSignature} from '../../lib/rhythm';
import {RhythmMarkers} from '../../features/rhythm/RhythmPanel';
import {TimelineClip} from './TimelineClip';
import type {Drag, Selection} from '../../types/editor';

type Props = {
  project: ReelProject;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  duration: number;
  zoom: number;
  onSetZoom: (z: number) => void;
  cursor: number;
  onSeek: (t: number) => void;
  transcriptCuesCount: number;
  onSelectAllCaptions: () => void;
  onFocusRhythm: (id: string) => void;
  onDown: (e: RPointerEvent<HTMLElement>, kind: Drag['kind'], id: string, mode: Drag['mode'], wordId?: string) => void;
  onMove: (e: RPointerEvent<HTMLElement>) => void;
  onEnd: () => void;
  onSelectClip: (kind: Drag['kind'], id: string, wordId: string | undefined, start: number, additive: boolean) => void;
  selected: Selection | null;
  selectedCueIds: string[];
  cue: Cue | undefined;
  wordExpanded: boolean;
  startScrub: (e: RPointerEvent<HTMLElement>) => void;
  moveScrub: (e: RPointerEvent<HTMLElement>) => void;
  endScrub: () => void;
};

export const Timeline: React.FC<Props> = ({
  project: p,
  timelineRef,
  duration,
  zoom,
  onSetZoom,
  cursor,
  onSeek,
  transcriptCuesCount,
  onSelectAllCaptions,
  onFocusRhythm,
  onDown,
  onMove,
  onEnd,
  onSelectClip,
  selected,
  selectedCueIds,
  cue,
  wordExpanded,
  startScrub,
  moveScrub,
  endScrub
}) => {
  const trackRows = useMemo(() => [
    {
      name: '🎞 VÍDEO',
      kind: 'clip',
      items: p.clips.map(c => ({id: c.id, start: c.start, end: c.end, label: 'Corte ' + c.src.split('/').pop()?.slice(0, 7)}))
    },
    {
      name: '💬 LEGENDAS GERADAS',
      kind: 'cue',
      items: cueTracks(p.cues).captions.map(c => ({id: c.id, start: c.start, end: c.end, label: c.text.replace(/[\[\]]/g, '')}))
    },
    {
      name: 'T TEXTOS MANUAIS / ESTILOS',
      kind: 'cue',
      items: cueTracks(p.cues).texts.map(c => ({id: c.id, start: c.start, end: c.end, label: c.text.replace(/[\[\]]/g, '')}))
    },
    {
      name: '🔤 PALAVRAS DA LEGENDA',
      kind: 'word',
      items: wordExpanded && cue ? normalizeWords(cue).map(w => ({id: w.id, start: w.start, end: w.end, label: w.text})) : []
    },
    {
      name: '🎬 B-ROLL',
      kind: 'overlay',
      items: p.overlays.filter(o => o.kind === 'video' || o.mediaRole === 'broll').map(o => ({id: o.id, start: o.start, end: o.end, label: o.name}))
    },
    {
      name: '🧩 ELEMENTOS LIVRES',
      kind: 'overlay',
      items: p.overlays.filter(o => o.mediaRole !== 'broll' && (o.kind === 'shape' || o.kind === 'image' || o.kind === 'text')).map(o => ({id: o.id, start: o.start, end: o.end, label: o.name}))
    },
    {
      name: '✨ EFEITOS',
      kind: 'overlay',
      items: p.overlays.filter(o => o.kind === 'effect').map(o => ({id: o.id, start: o.start, end: o.end, label: o.name}))
    },
    {
      name: '🔊 ÁUDIO',
      kind: 'overlay',
      items: p.overlays.filter(o => o.kind === 'audio').map(o => ({id: o.id, start: o.start, end: o.end, label: o.name}))
    }
  ], [p, wordExpanded, cue]);

  const canvasWidth = Math.max(1100, (duration + 1) * zoom);

  return (
    <section className="timelineSection">
      <div className="timelineToolbar">
        <div>
          <b>TIMELINE MULTICAMADAS</b>
          <span> Arraste blocos e bordas para editar com precisão de frames</span>
        </div>
        <div>
          <button onClick={() => onSeek(0)}>⏮</button>
          <button disabled={!transcriptCuesCount} onClick={onSelectAllCaptions}>
            Selecionar legendas ({transcriptCuesCount})
          </button>
          <label>
            Zoom{' '}
            <input
              type="range"
              min="30"
              max="240"
              value={zoom}
              onChange={e => onSetZoom(+e.target.value)}
            />
          </label>
          <span>{zoom} px/s</span>
        </div>
      </div>

      <div className="timelineScroll" ref={timelineRef}>
        <div className="rulerLine">
          <div className="trackLabel">TEMPO</div>
          <div
            className="rulerCanvas"
            style={{width: canvasWidth}}
            onPointerDown={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              onSeek((e.clientX - rect.left) / zoom);
            }}
          >
            {Array.from({length: Math.ceil(duration) + 1}, (_, i) => (
              <span key={i} style={{left: i * zoom}}>
                {i}s
              </span>
            ))}
          </div>
        </div>

        {p.editorial && p.editorial.signature === rhythmSignature(p) && (
          <RhythmMarkers
            analysis={p.editorial}
            zoom={zoom}
            width={canvasWidth}
            onSeek={onSeek}
            onSuggestion={onFocusRhythm}
          />
        )}

        {trackRows.map(row => (
          <div className="trackRow" key={row.name}>
            <div className="trackLabel">{row.name}</div>
            <div className="trackCanvas" style={{width: canvasWidth}}>
              {row.items.map(item => {
                const isActive =
                  row.kind === 'cue'
                    ? selectedCueIds.includes(item.id)
                    : selected?.kind === row.kind &&
                      (row.kind === 'word' ? selected.wordId === item.id : selected.id === item.id);
                return (
                  <TimelineClip
                    key={item.id}
                    kind={row.kind as Drag['kind']}
                    id={row.kind === 'word' ? cue?.id ?? '' : item.id}
                    wordId={row.kind === 'word' ? item.id : undefined}
                    start={item.start}
                    end={item.end}
                    text={item.label || ''}
                    active={isActive}
                    zoom={zoom}
                    onDown={onDown}
                    onMove={onMove}
                    onEnd={onEnd}
                    onSelect={additive =>
                      onSelectClip(
                        row.kind as Drag['kind'],
                        item.id,
                        row.kind === 'word' ? item.id : undefined,
                        item.start,
                        additive
                      )
                    }
                  />
                );
              })}
              <div
                className="cursorLine"
                aria-label="Arraste para mover o playhead"
                style={{left: cursor * zoom}}
                onPointerDown={startScrub}
                onPointerMove={moveScrub}
                onPointerUp={endScrub}
                onLostPointerCapture={endScrub}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="timelineFooter">
        🎯 Selecione legenda → aplique estilo individual · Selecione palavra → ajuste animação e tempo · Keyframes → animação livre · ⌥ Importação SRT preserva os tempos
      </div>
    </section>
  );
};
