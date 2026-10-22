import React from 'react';
import { interpolate, spring } from 'remotion';

export interface SpeedGaugeSceneProps {
  label?: string;
  speedText?: string;
  color?: string;
  fps?: number;
  frame?: number;
}

export const SpeedGaugeScene: React.FC<SpeedGaugeSceneProps> = ({
  label = 'VELOCIDADE MÁXIMA',
  speedText = '10X',
  color = '#ff0055',
  fps = 30,
  frame = 0
}) => {
  const needleSpring = spring({ frame, fps, config: { damping: 9, stiffness: 180, mass: 0.7 } });
  const needleAngle = interpolate(needleSpring, [0, 1], [-120, 105]);
  const needleJitter = Math.sin(frame * 1.8) * 4;

  return (
    <div
      style={{
        position: 'relative',
        width: '320px',
        height: '240px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <svg viewBox="0 0 300 220" width="300" height="220" style={{ overflow: 'visible' }}>
        {/* Outer Circular Arc */}
        <path
          d="M 50 180 A 110 110 0 1 1 250 180"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Redline Active Arc */}
        <path
          d="M 200 85 A 110 110 0 0 1 250 180"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />

        {/* Center Hub */}
        <circle cx="150" cy="180" r="18" fill="#ffffff" />
        <circle cx="150" cy="180" r="10" fill="#111111" />

        {/* Gauge Needle */}
        <line
          x1="150"
          y1="180"
          x2="150"
          y2="75"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          transform={`rotate(${needleAngle + needleJitter} 150 180)`}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>

      {/* Digital Speedometer Readout */}
      <div
        style={{
          marginTop: '-30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2
        }}
      >
        <span
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: '52px',
            fontWeight: 900,
            color,
            lineHeight: 1,
            textShadow: `0 0 20px ${color}`
          }}
        >
          {speedText}
        </span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            opacity: 0.9
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
