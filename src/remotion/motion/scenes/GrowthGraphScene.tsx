import React from 'react';
import { interpolate, spring } from 'remotion';

export interface GrowthGraphSceneProps {
  label?: string;
  metric?: string;
  color?: string;
  fps?: number;
  frame?: number;
}

export const GrowthGraphScene: React.FC<GrowthGraphSceneProps> = ({
  label = 'CRESCIMENTO',
  metric = '+340%',
  color = '#00f0ff',
  fps = 30,
  frame = 0
}) => {
  const lineSpring = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const textSpring = spring({ frame: frame - 6, fps, config: { damping: 11, stiffness: 140 } });
  const pathLen = 700;
  const dashOffset = pathLen * (1 - lineSpring);

  const glowOpacity = interpolate(lineSpring, [0.4, 1], [0, 0.8]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '560px',
        pointerEvents: 'none'
      }}
    >
      {/* Metric Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 24px',
          borderRadius: '999px',
          background: 'rgba(10, 15, 25, 0.85)',
          border: `2px solid ${color}`,
          boxShadow: `0 0 24px ${color}66`,
          transform: `scale(${textSpring})`,
          marginBottom: '16px'
        }}
      >
        <span style={{ color: '#fff', fontSize: '24px', fontWeight: 800, letterSpacing: '1px' }}>
          {label}
        </span>
        <span
          style={{
            color,
            fontSize: '34px',
            fontWeight: 900,
            textShadow: `0 0 12px ${color}`
          }}
        >
          {metric}
        </span>
      </div>

      {/* Vector Line Graph */}
      <svg
        viewBox="0 0 500 240"
        style={{ width: '100%', height: '240px', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="graphFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Filled Area */}
        <path
          d="M 20 220 L 20 180 Q 120 170, 200 130 T 360 80 T 480 20 L 480 220 Z"
          fill="url(#graphFill)"
          opacity={glowOpacity}
        />

        {/* Main Glowing Line */}
        <path
          d="M 20 180 Q 120 170, 200 130 T 360 80 T 480 20"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={pathLen}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />

        {/* Peak Indicator Dot */}
        {lineSpring > 0.85 && (
          <circle
            cx="480"
            cy="20"
            r={10 * spring({ frame: frame - 12, fps, config: { damping: 9, stiffness: 200 } })}
            fill="#ffffff"
            stroke={color}
            strokeWidth="5"
            style={{ filter: `drop-shadow(0 0 16px ${color})` }}
          />
        )}
      </svg>
    </div>
  );
};
