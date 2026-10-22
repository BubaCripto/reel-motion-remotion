import React from 'react';
import { interpolate } from 'remotion';

export interface SpeedLinesOverlayProps {
  count?: number;
  color?: string;
  intensity?: number;
  frame?: number;
  fps?: number;
}

export const SpeedLinesOverlay: React.FC<SpeedLinesOverlayProps> = ({
  count = 24,
  color = 'rgba(255, 255, 255, 0.35)',
  intensity = 1,
  frame = 0
}) => {
  const flicker = Math.sin(frame * 1.5) > 0 ? 1 : 0.7;
  const lines = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360;
    const len = 120 + ((i * 37) % 180);
    const strokeW = 2 + ((i * 7) % 6);
    const offset = Math.sin(frame * 0.8 + i) * 15;
    return { id: i, angle, len, strokeW, offset };
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: intensity * flicker
      }}
    >
      <svg
        viewBox="0 0 1080 1920"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="centerMask" cx="50%" cy="50%" r="50%">
            <stop offset="35%" stopColor="#000" stopOpacity="0" />
            <stop offset="85%" stopColor="#fff" stopOpacity="1" />
          </radialGradient>
        </defs>

        <g mask="url(#speedMask)">
          <mask id="speedMask">
            <rect width="1080" height="1920" fill="url(#centerMask)" />
          </mask>

          {lines.map((l) => (
            <line
              key={l.id}
              x1="540"
              y1="960"
              x2="540"
              y2={960 - 900 - l.len + l.offset}
              stroke={color}
              strokeWidth={l.strokeW}
              strokeLinecap="round"
              transform={`rotate(${l.angle} 540 960)`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
