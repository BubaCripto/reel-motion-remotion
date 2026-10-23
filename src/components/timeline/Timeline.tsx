import React, {useMemo, useState, type PointerEvent as RPointerEvent} from 'react';
import type {Cue, ReelProject, TimelineTrackId, TrackSettings} from '../../lib/project';
import {cueTracks, normalizeWords} from '../../lib/project';
import {rhythmSignature} from '../../lib/rhythm';
import {RhythmMarkers} from '../../features/rhythm/RhythmPanel';
import {TimelineClip} from './TimelineClip';
import {formatTimecode, type Drag, type Selection} from '../../types/editor';

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
  onSelectClip: (kind: Drag['kind'], id: string, wordId: string | undefined, start: number, additive: boolean, seekOnSelect: boolean) => void;
  selected: Selection | null;
  selectedCueIds: string[];
  cue: Cue | undefined;
  wordExpanded: boolean;
  startScrub: (e: RPointerEvent<HTMLElement>) => void;
  moveScrub: (e: RPointerEvent<HTMLElement>) => void;
  endScrub: () => void;
  snapLine?: number | null;
  onSelectMultipleCues?: (ids: string[]) => void;
  onUpdateTrack: (id: TimelineTrackId, patch: NonNullable<TrackSettings[TimelineTrackId]>) => void;
  onMoveTrack: (id: TimelineTrackId, direction: -1 | 1) => void;
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
  endScrub,
  snapLine = null,
  onSelectMultipleCues,
  onUpdateTrack,
  onMoveTrack
}) => {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [marquee, setMarquee] = useState<{startX: number; currentX: number; additive: boolean} | null>(null);
  const trackRows = useMemo(() => [
    {
      id: 'video' as const,
      name: '🎞 VÍDEO',
      kind: 'clip',
      items: p.clips.map(c => ({
        id: c.id,
        start: c.start,
        end: c.end,
        label: 'Corte ' + c.src.split('/').pop()?.slice(0, 7),
        src: c.src,
        sourceStart: c.sourceStart,
        speed: c.speed,
        waveformColor: '#38bdf8'
      }))
    },
    {
      id: 'captions' as const,
      name: '💬 LEGENDAS GERADAS',
      kind: 'cue',
      items: cueTracks(p.cues).captions.map(c => ({
        id: c.id,
        start: c.start,
        end: c.end,
        label: c.text.replace(/[\[\]]/g, '')
      }))
    },
    {
      id: 'texts' as const,
      name: 'T TEXTOS MANUAIS / ESTILOS',
      kind: 'cue',
      items: cueTracks(p.cues).texts.map(c => ({
        id: c.id,
        start: c.start,
        end: c.end,
        label: c.text.replace(/[\[\]]/g, '')
      }))
    },
    {
      id: 'words' as const,
      name: '🔤 PALAVRAS DA LEGENDA',
      kind: 'word',
      items: wordExpanded && cue ? normalizeWords(cue).map(w => ({
        id: w.id,
        start: w.start,
        end: w.end,
        label: w.text
      })) : []
    },
    {
      id: 'motion' as const,
      name: '⚡ MOTION GRAPHICS',
      kind: 'overlay',
      items: p.overlays.filter(o => o.kind === 'motion').map(o => {
        let icon = '⚡';
        if (o.motionType === 'scene') {
          const s = o.motionProps?.scene;
          icon = s === 'growth-graph' ? '📈' : s === 'target-lock' ? '🎯' : s === 'rocket-launch' ? '🚀' : s === 'stamp-impact' ? '💥' : s === 'hazard-warning' ? '⚠️' : s === 'hourglass' ? '⏳' : s === 'speed-gauge' ? '⚡' : '🧠';
        } else if (o.motionType === 'kinetic-text') {
          icon = '🔤';
        } else if (o.motionType === 'stroke-path') {
          icon = '✏️';
        } else if (o.motionType === 'burst') {
          icon = '✨';
        } else if (o.motionType === 'speed-lines') {
          icon = '⚡';
        } else if (o.motionType === 'camera-shake') {
          icon = '📳';
        }
        return {
          id: o.id,
          start: o.start,
          end: o.end,
          label: `${icon} ${o.name || o.text || 'Motion'}`,
          subKind: 'motion'
        };
      })
    },
    {
      id: 'broll' as const,
      name: '🎬 B-ROLL',
      kind: 'overlay',
      items: p.overlays.filter(o => o.kind === 'video' || o.mediaRole === 'broll').map(o => ({
        id: o.id,
        start: o.start,
        end: o.end,
        label: o.name,
        src: o.src,
        waveformColor: '#fbbf24'
      }))
    },
    {
      id: 'elements' as const,
      name: '🧩 ELEMENTOS LIVRES',
      kind: 'overlay',
      items: p.overlays.filter(o => o.mediaRole !== 'broll' && (o.kind === 'shape' || o.kind === 'image' || o.kind === 'text')).map(o => ({
        id: o.id,
        start: o.start,
        end: o.end,
        label: o.name
      }))
    },
    {
      id: 'effects' as const,
      name: '✨ EFEITOS',
      kind: 'overlay',
      items: p.overlays.filter(o => o.kind === 'effect').map(o => ({
        id: o.id,
        start: o.start,
        end: o.end,
        label: o.name
      }))
    },
    {
      id: 'audio' as const,
      name: '🔊 ÁUDIO',
      kind: 'overlay',
      items: p.overlays.filter(o => o.kind === 'audio').map(o => ({
        id: o.id,
        start: o.start,
        end: o.end,
        label: o.name,
        src: o.src,
        waveformColor: '#34d399'
      }))
    }
  ], [p, wordExpanded, cue]);

  const canvasWidth = Math.max(1100, (duration + 1) * zoom);
  const orderedRows = useMemo(() => {
    const order = p.trackOrder?.length ? p.trackOrder : trackRows.map(row => row.id);
    return [...trackRows].sort((a, b) => {
      const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  }, [p.trackOrder, trackRows]);

  return (
    <section className="timelineSection">
      <div className="timelineToolbar">
        <div>
          <b>TIMELINE MULTICAMADAS</b>
          <span> Arraste blocos e bordas para editar com precisão de frames · Zoom: Ctrl + Roda do Mouse</span>
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

      <div
        className="timelineScroll"
        ref={timelineRef}
        onWheel={e => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 12 : -12;
            onSetZoom(Math.max(30, Math.min(240, zoom + delta)));
          }
        }}
      >
        <div className="rulerLine">
          <div className="trackLabel">TEMPO</div>
          <div
            className="rulerCanvas"
            style={{width: canvasWidth}}
            onPointerDown={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              onSeek((e.clientX - rect.left) / zoom);
            }}
            onPointerMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              setHoverX(x);
              setHoverTime(Math.max(0, x / zoom));
            }}
            onPointerLeave={() => {
              setHoverX(null);
              setHoverTime(null);
            }}
          >
            {Array.from({length: Math.ceil(duration) + 1}, (_, i) => (
              <span key={i} style={{left: i * zoom}}>
                {i}s
              </span>
            ))}

            {hoverX !== null && hoverTime !== null && (
              <div className="rulerHoverTooltip" style={{left: hoverX}}>
                ⏱ {formatTimecode(hoverTime, p.fps)}
              </div>
            )}
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

        {orderedRows.map((row, rowIndex) => {
          const settings = p.trackSettings?.[row.id] ?? {};
          const collapsed = !!settings.collapsed;
          const isAudioLane = row.id === 'audio' || row.id === 'video';
          return (
          <div className="trackRow" key={row.name}>
            <div className="trackLabel trackLabelWithControl">
              <div className="trackTitle">
                <span>{row.name}</span>
              </div>
              <div className="trackActions" onPointerDown={e => e.stopPropagation()}>
                <button
                  className="trackCollapse"
                  title={collapsed ? 'Expandir trilha' : 'Recolher trilha'}
                  aria-label={`${collapsed ? 'Expandir' : 'Recolher'} ${row.name}`}
                  onClick={() => onUpdateTrack(row.id, {...settings, collapsed: !collapsed})}
                >{collapsed ? '›' : '⌄'}</button>
                <button title={settings.hidden ? 'Mostrar no preview e exportação' : 'Ocultar do preview e exportação'} onClick={() => onUpdateTrack(row.id, {...settings, hidden: !settings.hidden})}>{settings.hidden ? '◌' : '◉'}</button>
                <button title={settings.locked ? 'Desbloquear edição' : 'Bloquear edição'} onClick={() => onUpdateTrack(row.id, {...settings, locked: !settings.locked})}>{settings.locked ? '🔒' : '🔓'}</button>
                {isAudioLane && <button title={settings.muted ? 'Ativar áudio da trilha' : 'Silenciar áudio da trilha'} onClick={() => onUpdateTrack(row.id, {...settings, muted: !settings.muted})}>{settings.muted ? '🔇' : '🔊'}</button>}
                <button title={settings.solo ? 'Desativar solo' : 'Ouvir/ver somente esta trilha'} onClick={() => onUpdateTrack(row.id, {...settings, solo: !settings.solo})}>{settings.solo ? 'S' : 's'}</button>
                <button disabled={rowIndex === 0} title="Mover trilha para cima" onClick={() => onMoveTrack(row.id, -1)}>↑</button>
                <button disabled={rowIndex === orderedRows.length - 1} title="Mover trilha para baixo" onClick={() => onMoveTrack(row.id, 1)}>↓</button>
              </div>
            </div>
            {!collapsed && <div
              className="trackCanvas"
              style={{width: canvasWidth}}
              onPointerDown={e => {
                if (e.target === e.currentTarget) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  setMarquee({startX: x, currentX: x, additive: e.shiftKey || e.ctrlKey || e.metaKey});
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerMove={e => {
                if (marquee) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const currentX = e.clientX - rect.left;
                  setMarquee(m => (m ? {...m, currentX} : null));
                  const minX = Math.min(marquee.startX, currentX);
                  const maxX = Math.max(marquee.startX, currentX);
                  const minT = minX / zoom;
                  const maxT = maxX / zoom;
                  // Marquee selection is scoped to the authored/generated text lane
                  // where it started; dragging over video or motion cannot select text.
                  const hitCues = row.kind === 'cue'
                    ? row.items.filter(item => item.start <= maxT && item.end >= minT).map(item => item.id)
                    : [];
                  if (row.kind === 'cue' && onSelectMultipleCues) {
                    onSelectMultipleCues(
                      marquee.additive
                        ? Array.from(new Set([...selectedCueIds, ...hitCues]))
                        : hitCues
                    );
                  }
                }
              }}
              onPointerUp={() => setMarquee(null)}
              onLostPointerCapture={() => setMarquee(null)}
            >
              {marquee && (
                <div
                  className="timelineMarquee"
                  style={{
                    left: Math.min(marquee.startX, marquee.currentX),
                    top: 0,
                    width: Math.max(4, Math.abs(marquee.currentX - marquee.startX)),
                    height: '100%'
                  }}
                />
              )}
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
                    src={(item as any).src}
                    sourceStart={(item as any).sourceStart}
                    speed={(item as any).speed}
                    waveformColor={(item as any).waveformColor}
                    subKind={(item as any).subKind}
                    locked={!!settings.locked}
                    onDown={onDown}
                    onMove={onMove}
                    onEnd={onEnd}
                    onSelect={additive =>
                      onSelectClip(
                        row.kind as Drag['kind'],
                        item.id,
                        row.kind === 'word' ? item.id : undefined,
                        item.start,
                        additive,
                        (item as {subKind?: string}).subKind !== 'motion'
                      )
                    }
                  />
                );
              })}

              {/* Visual Magnetic Snap Guide Line */}
              {snapLine !== null && (
                <div className="snapGuideLine" style={{left: snapLine * zoom}}>
                  <span className="snapGuideBadge">🧲 {formatTimecode(snapLine, p.fps)}</span>
                </div>
              )}

              {/* Playhead Cursor */}
              <div
                className="cursorLine"
                aria-label="Arraste para mover o playhead"
                style={{left: cursor * zoom}}
                onPointerDown={startScrub}
                onPointerMove={moveScrub}
                onPointerUp={endScrub}
                onLostPointerCapture={endScrub}
              >
                <span className="cursorTimeBadge">{formatTimecode(cursor, p.fps)}</span>
              </div>
            </div>}
          </div>
        );})}
      </div>

      <div className="timelineFooter">
        🎯 Selecione legenda → aplique estilo individual · Selecione palavra → ajuste animação e tempo · Keyframes → animação livre · ⌥ Importação SRT preserva os tempos
      </div>
    </section>
  );
};
