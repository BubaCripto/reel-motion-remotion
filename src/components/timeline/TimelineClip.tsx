import React, {type PointerEvent as RPointerEvent} from 'react';
import type {Drag} from '../../types/editor';
import {AudioWaveform} from './AudioWaveform';

export type TimelineProps = {
  kind: Drag['kind'];
  id: string;
  wordId?: string;
  start: number;
  end: number;
  text: string;
  active: boolean;
  zoom: number;
  src?: string;
  sourceStart?: number;
  speed?: number;
  waveformColor?: string;
  subKind?: string;
  onDown: (e: RPointerEvent<HTMLElement>, kind: Drag['kind'], id: string, mode: Drag['mode'], wordId?: string) => void;
  onMove: (e: RPointerEvent<HTMLElement>) => void;
  onEnd: () => void;
  onSelect: (additive: boolean) => void;
};

export function TimelineClip({
  kind,
  id,
  wordId,
  start,
  end,
  text,
  active,
  zoom,
  src,
  sourceStart,
  speed,
  waveformColor,
  subKind,
  onDown,
  onMove,
  onEnd,
  onSelect
}: TimelineProps) {
  const isMotion = subKind === 'motion';

  return (
    <div
      className={`timelineClip ${kind} ${subKind || ''} ${active ? 'active' : ''}`}
      style={{
        left: start * zoom,
        width: Math.max(11, (end - start) * zoom),
        position: 'absolute',
        overflow: 'hidden',
        ...(isMotion ? {
          background: active
            ? 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)'
            : 'linear-gradient(135deg, #5b21b6 0%, #be185d 100%)',
          borderColor: active ? '#ffffff' : '#f472b6',
          boxShadow: active
            ? '0 0 0 2px #fff, 0 4px 14px rgba(236,72,153,0.6)'
            : '0 2px 8px rgba(190,24,93,0.35)',
          fontWeight: 700,
          color: '#ffffff'
        } : {})
      }}
      onPointerMove={onMove}
      onLostPointerCapture={onEnd}
      onPointerUp={onEnd}
      onClick={e => {
        e.stopPropagation();
        onSelect(e.shiftKey || e.ctrlKey || e.metaKey);
      }}
    >
      {src && (
        <AudioWaveform
          src={src}
          start={start}
          end={end}
          sourceStart={sourceStart}
          speed={speed}
          zoom={zoom}
          color={waveformColor}
        />
      )}
      <span className="edge" onPointerDown={e => onDown(e, kind, id, 'start', wordId)} />
      <span className="clipLabel" title={text} onPointerDown={e => onDown(e, kind, id, 'move', wordId)}>
        {text}
      </span>
      <span className="edge" onPointerDown={e => onDown(e, kind, id, 'end', wordId)} />
    </div>
  );
}
