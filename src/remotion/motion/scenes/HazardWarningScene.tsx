import React from 'react';
import { interpolate, spring } from 'remotion';

export interface HazardWarningSceneProps {
  label?: string;
  color?: string;
  fps?: number;
  frame?: number;
}

export const HazardWarningScene: React.FC<HazardWarningSceneProps> = ({
  label = 'ATENÇÃO CRÍTICA',
  color = '#ffe043',
  fps = 30,
  frame = 0
}) => {
  const enterSpring = spring({ frame, fps, config: { damping: 11, stiffness: 140 } });
  const offset = (frame * 5) % 60;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${enterSpring})`,
        pointerEvents: 'none'
      }}
    >
      {/* Top Hazard Stripe */}
      <div
        style={{
          width: '100%',
          height: '24px',
          backgroundImage: `repeating-linear-gradient(45deg, #111, #111 20px, ${color} 20px, ${color} 40px)`,
          backgroundPosition: `${offset}px 0`,
          boxShadow: `0 0 16px ${color}66`
        }}
      />

      {/* Center Warning Label */}
      <div
        style={{
          width: '100%',
          padding: '16px 24px',
          background: 'rgba(10, 10, 14, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px'
        }}
      >
        <span style={{ fontSize: '32px' }}>⚠️</span>
        <span
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: '44px',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '3px',
            textTransform: 'uppercase'
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '32px' }}>⚠️</span>
      </div>

      {/* Bottom Hazard Stripe */}
      <div
        style={{
          width: '100%',
          height: '24px',
          backgroundImage: `repeating-linear-gradient(-45deg, #111, #111 20px, ${color} 20px, ${color} 40px)`,
          backgroundPosition: `-${offset}px 0`,
          boxShadow: `0 0 16px ${color}66`
        }}
      />
    </div>
  );
};
