import React from 'react';
import { interpolate, spring } from 'remotion';

export interface HourglassSceneProps {
  label?: string;
  color?: string;
  fps?: number;
  frame?: number;
}

export const HourglassScene: React.FC<HourglassSceneProps> = ({
  label = 'TEMPO ESGOTANDO',
  color = '#00f0ff',
  fps = 30,
  frame = 0
}) => {
  const enterSpring = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
  const rotHourglass = interpolate(frame, [0, 18], [0, 180], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const sandFlow = interpolate(frame, [15, 60], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${enterSpring})`,
        pointerEvents: 'none'
      }}
    >
      <div style={{ transform: `rotate(${rotHourglass}deg)`, filter: `drop-shadow(0 0 16px ${color}88)` }}>
        <svg viewBox="0 0 140 200" width="140" height="200">
          {/* Glass Outer Shell */}
          <path
            d="M 20 20 L 120 20 L 75 100 L 120 180 L 20 180 L 65 100 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Top Sand Pile (Draining) */}
          <polygon
            points={`30,${30 + sandFlow * 0.5} 110,${30 + sandFlow * 0.5} 70,95`}
            fill={color}
            opacity={Math.max(0, 1 - sandFlow / 100)}
          />

          {/* Sand Falling Stream */}
          {sandFlow > 5 && sandFlow < 95 && (
            <line x1="70" y1="100" x2="70" y2="175" stroke={color} strokeWidth="3" strokeDasharray="4 4" />
          )}

          {/* Bottom Sand Pile (Accumulating) */}
          <polygon
            points={`70,${180 - sandFlow * 0.45} ${30 + (100 - sandFlow) * 0.2},175 ${110 - (100 - sandFlow) * 0.2},175`}
            fill={color}
          />
        </svg>
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '6px 20px',
          borderRadius: '999px',
          background: 'rgba(10, 15, 25, 0.85)',
          border: `2px solid ${color}`,
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '18px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          boxShadow: `0 0 20px ${color}66`
        }}
      >
        {label}
      </div>
    </div>
  );
};
