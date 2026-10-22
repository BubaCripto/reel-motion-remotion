import React from 'react';
import { interpolate, spring } from 'remotion';

export interface TargetLockSceneProps {
  label?: string;
  coordinates?: string;
  color?: string;
  fps?: number;
  frame?: number;
}

export const TargetLockScene: React.FC<TargetLockSceneProps> = ({
  label = 'ALVO TRAVADO',
  coordinates = 'REC [4K] 60FPS',
  color = '#ff0055',
  fps = 30,
  frame = 0
}) => {
  const enterSpring = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
  const rotRing = interpolate(frame, [0, 90], [0, 180]);
  const lockScale = interpolate(enterSpring, [0, 1], [1.8, 1]);

  return (
    <div
      style={{
        position: 'relative',
        width: '360px',
        height: '360px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${lockScale})`,
        pointerEvents: 'none'
      }}
    >
      <svg
        viewBox="0 0 360 360"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {/* Outer Viewfinder Bracket Corners */}
        <path d="M 40 90 L 40 40 L 90 40" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M 270 40 L 320 40 L 320 90" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M 40 270 L 40 320 L 90 320" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
        <path d="M 270 320 L 320 320 L 320 270" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />

        {/* Rotating Circular Reticle */}
        <g transform={`rotate(${rotRing} 180 180)`}>
          <circle cx="180" cy="180" r="85" fill="none" stroke={color} strokeWidth="3" strokeDasharray="14 10" />
          <circle cx="180" cy="180" r="110" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 8" opacity="0.6" />
        </g>

        {/* Center Target Dot & Reticle Cross */}
        <circle cx="180" cy="180" r="8" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
        <line x1="180" y1="130" x2="180" y2="160" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1="180" y1="200" x2="180" y2="230" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1="130" y1="180" x2="160" y2="180" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1="200" y1="180" x2="230" y2="180" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Target Status Tag */}
      <div
        style={{
          position: 'absolute',
          bottom: '18px',
          padding: '4px 14px',
          borderRadius: '4px',
          background: color,
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '16px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          boxShadow: `0 0 16px ${color}88`
        }}
      >
        {label}
      </div>

      {/* Tech Coordinates Text */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          letterSpacing: '1px',
          opacity: 0.8
        }}
      >
        {coordinates}
      </div>
    </div>
  );
};
