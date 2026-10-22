import React, {type PointerEvent as RPointerEvent} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {ReelVideo} from '../../remotion/ReelVideo';
import {animatedValue, durationFrames, seconds, type Cue, type Overlay, type ReelProject, type VideoClip} from '../../lib/project';
import {COMMON_FRAME_RATES, formatFps, sameFps} from '../../lib/frame-rate';
import {SourceFrameRates} from '../../features/SourceFrameRates';
import type {Selection} from '../../types/editor';

type Props = {
  project: ReelProject;
  fps: number;
  duration: number;
  cursor: number;
  playing: boolean;
  playerRef: React.RefObject<PlayerRef | null>;
  previewRef: React.RefObject<HTMLDivElement | null>;
  previewStageRef: React.RefObject<HTMLDivElement | null>;
  safeZone: boolean;
  onSetSafeZone: (v: boolean) => void;
  safeTarget: 'reels' | 'post';
  onSetSafeTarget: (v: 'reels' | 'post') => void;
  selected: Selection | null;
  cue: Cue | undefined;
  overlay: Overlay | undefined;
  clip: VideoClip | undefined;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
  onPositionStart: (e: RPointerEvent<HTMLElement>) => void;
  onPositionMove: (e: RPointerEvent<HTMLElement>) => void;
  onPositionEnd: () => void;
  sourceRates: any;
  onChooseFrameRate: (v: string) => void;
  onChangeProject: (patch: Partial<ReelProject>) => void;
  onUndo: () => void;
  onRedo: () => void;
  notice: string;
  error: string;
  renderJob: string;
  jobProgress?: number | null;
  out: string;
};

export const PreviewStage: React.FC<Props> = ({
  project: p,
  fps,
  duration,
  cursor,
  playing,
  playerRef,
  previewRef,
  previewStageRef,
  safeZone,
  onSetSafeZone,
  safeTarget,
  onSetSafeTarget,
  selected,
  cue,
  overlay,
  clip,
  onSeek,
  onTogglePlay,
  onToggleFullscreen,
  onPositionStart,
  onPositionMove,
  onPositionEnd,
  sourceRates,
  onChooseFrameRate,
  onChangeProject,
  onUndo,
  onRedo,
  notice,
  error,
  renderJob,
  jobProgress,
  out
}) => {
  const playerProps = React.useMemo(() => ({project: p}), [p]);

  const handleX = cue
    ? animatedValue(cue.keyframes, cursor, 'x', cue.x ?? 50)
    : overlay
    ? animatedValue(overlay.keyframes, cursor, 'x', overlay.x)
    : clip
    ? animatedValue(clip.keyframes, cursor, 'x', clip.x ?? 50)
    : 50;

  const handleY = cue
    ? animatedValue(cue.keyframes, cursor, 'y', cue.y ?? 70)
    : overlay
    ? animatedValue(overlay.keyframes, cursor, 'y', overlay.y)
    : clip
    ? animatedValue(clip.keyframes, cursor, 'y', clip.y ?? 50)
    : 70;

  return (
    <main className="previewPanel">
      <div className="previewHeader">
        <span>PREVIEW · {p.width} × {p.height} ({p.aspectRatio || '9:16'}) · {formatFps(p.fps)} FPS</span>
        <label className="check">
          <input
            type="checkbox"
            checked={safeZone}
            onChange={e => onSetSafeZone(e.target.checked)}
          />{' '}
          Safe area
        </label>
        {safeZone && (
          <select
            className="safeTarget"
            value={safeTarget}
            onChange={e => onSetSafeTarget(e.target.value as 'reels' | 'post')}
          >
            <option value="reels">Reels · Meta</option>
            <option value="post">Post feed · 4:5</option>
          </select>
        )}
      </div>

      <div ref={previewRef} className="previewFrame" style={{aspectRatio: `${p.width} / ${p.height}`}}>
        <div ref={previewStageRef} className="previewStage">
          <Player
            ref={playerRef}
            component={ReelVideo}
            inputProps={playerProps}
            fps={fps}
            compositionWidth={p.width}
            compositionHeight={p.height}
            durationInFrames={durationFrames(p)}
            style={{width: '100%', height: '100%'}}
            controls={false}
            autoPlay={false}
            loop={false}
          />
          {safeZone && (
            <div className={`safeZoneFrame ${safeTarget}`}>
              <span>
                {safeTarget === 'reels' ? 'ÁREA SEGURA — REELS · META' : 'ÁREA VISÍVEL — POST FEED 4:5'}
              </span>
            </div>
          )}
          {selected?.kind !== 'word' && (cue || overlay || clip) && (
            <div
              className="positionHandle"
              style={{left: `${handleX}%`, top: `${handleY}%`}}
              onPointerDown={onPositionStart}
              onPointerMove={onPositionMove}
              onLostPointerCapture={onPositionEnd}
              onPointerUp={onPositionEnd}
            >
              ✥
            </div>
          )}
        </div>
      </div>

      <div className="playerControls">
        <button title="Voltar ao início" onClick={() => onSeek(0)}>⏮</button>
        <button title="Frame anterior" onClick={() => onSeek(Math.max(0, cursor - 1 / fps))}>
          ‹ Frame
        </button>
        <button className="playButton" onClick={onTogglePlay}>
          {playing ? '❚❚ Pausar' : '▶ Reproduzir'}
        </button>
        <button title="Próximo frame" onClick={() => onSeek(cursor + 1 / fps)}>
          Frame ›
        </button>
        <button title="Ir ao final" onClick={() => onSeek(duration)}>⏭</button>
        <button title="Tela cheia" onClick={onToggleFullscreen}>⛶ Tela cheia</button>
        <span>{seconds(cursor)} / {seconds(duration)}</span>
      </div>

      <div className="projectInfo">
        <label>
          Projeto
          <input value={p.name} onChange={e => onChangeProject({name: e.target.value})} />
        </label>
        <label>
          FPS de exportação
          <select
            aria-label="FPS de exportação"
            value={p.exportFpsMode === 'source' ? 'source' : String(p.fps)}
            onChange={e => onChooseFrameRate(e.target.value)}
          >
            <option value="source">
              Automático · {sourceRates.main?.recommendedFps ? formatFps(sourceRates.main.recommendedFps) + ' fps' : 'aguardando fonte'}
            </option>
            {[...COMMON_FRAME_RATES, ...(COMMON_FRAME_RATES.includes(p.fps) ? [] : [p.fps])].sort((a, b) => a - b).map(rate => (
              <option key={rate} value={String(rate)}>
                {formatFps(rate)} fps
              </option>
            ))}
          </select>
        </label>
        <button onClick={onUndo}>↶ Desfazer</button>
        <button onClick={onRedo}>↷ Refazer</button>
      </div>

      <details className="sourceFpsCompact">
        <summary>
          Fonte: {formatFps(sourceRates.main?.fps)} fps · Exportação: {formatFps(p.fps)} fps
          {sourceRates.main?.recommendedFps && !sameFps(p.fps, sourceRates.main.recommendedFps) ? ' · ⚠ FPS diferentes' : ''}
        </summary>
        <SourceFrameRates project={p} state={sourceRates} onUseSource={() => onChooseFrameRate('source')} />
      </details>

      {notice && <div className="notice">✓ {notice}</div>}
      {error && <div className="errorBar">⚠ {error}</div>}
      {renderJob && (
        <div className="statusBar" style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>◌ {renderJob}</span>
            {typeof jobProgress === 'number' && (
              <strong style={{color: '#facc15', fontSize: 11}}>{jobProgress}%</strong>
            )}
          </div>
          {typeof jobProgress === 'number' && (
            <div style={{width: '100%', height: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden'}}>
              <div
                style={{
                  height: '100%',
                  width: `${jobProgress}%`,
                  background: 'linear-gradient(90deg, #eab308, #22d3ee)',
                  borderRadius: 3,
                  transition: 'width 0.25s ease'
                }}
              />
            </div>
          )}
        </div>
      )}
      {out && (
        <a className="downloadMp4" href={out} download>
          ⬇ Baixar vídeo MP4 finalizado
        </a>
      )}
    </main>
  );
};
