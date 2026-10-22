import React, {type PointerEvent as RPointerEvent} from 'react';
import type {Drag} from '../../types/editor';

export type TimelineProps = {
  kind: Drag['kind'];
  id: string;
  wordId?: string;
  start: number;
  end: number;
  text: string;
  active: boolean;
  zoom: number;
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
  onDown,
  onMove,
  onEnd,
  onSelect
}: TimelineProps) {
  return (
    <div
      className={`timelineClip ${kind} ${active ? 'active' : ''}`}
      style={{left: start * zoom, width: Math.max(11, (end - start) * zoom)}}
      onPointerMove={onMove}
      onLostPointerCapture={onEnd}
      onPointerUp={onEnd}
      onClick={e => {
        e.stopPropagation();
        onSelect(e.shiftKey || e.ctrlKey || e.metaKey);
      }}
    >
      <span className="edge" onPointerDown={e => onDown(e, kind, id, 'start', wordId)} />
      <span className="clipLabel" title={text} onPointerDown={e => onDown(e, kind, id, 'move', wordId)}>
        {text}
      </span>
      <span className="edge" onPointerDown={e => onDown(e, kind, id, 'end', wordId)} />
    </div>
  );
}
