import React from 'react';
import { interpolate, spring } from 'remotion';

export interface BurstParticlesProps {
  count?: number;
  colors?: string[];
  radius?: number;
  shape?: 'star' | 'circle' | 'spark' | 'diamond';
  fps?: number;
  frame?: number;
}

export const BurstParticles: React.FC<BurstParticlesProps> = ({
  count = 12,
  colors = ['#ffe043', '#ff0055', '#00f0ff', '#ffffff'],
  radius = 240,
  shape = 'spark',
  fps = 30,
  frame = 0
}) => {
  const burstSpring = spring({
    frame,
    fps,
    config: { damping: 9, stiffness: 220, mass: 0.6 }
  });

  const fadeOut = interpolate(frame, [0, 8, 22], [1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const distance = interpolate(burstSpring, [0, 1], [0, radius]);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const col = colors[i % colors.length];
    const size = 8 + (i % 3) * 6;
    const rot = (angle * 180) / Math.PI + frame * 8;

    return { id: i, x, y, col, size, rot };
  });

  return (
    <div
      style={{
        position: 'relative',
        width: 1,
        height: 1,
        overflow: 'visible',
        opacity: fadeOut,
        pointerEvents: 'none'
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            transform: `translate(-50%, -50%) rotate(${p.rot}deg) scale(${burstSpring})`,
            transformOrigin: 'center center'
          }}
        >
          {shape === 'circle' && (
            <div
              style={{
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: p.col,
                boxShadow: `0 0 12px ${p.col}`
              }}
            />
          )}

          {shape === 'spark' && (
            <div
              style={{
                width: p.size * 2.2,
                height: 4,
                borderRadius: 2,
                background: p.col,
                boxShadow: `0 0 10px ${p.col}`
              }}
            />
          )}

          {shape === 'diamond' && (
            <div
              style={{
                width: p.size * 1.2,
                height: p.size * 1.2,
                transform: 'rotate(45deg)',
                background: p.col,
                boxShadow: `0 0 8px ${p.col}`
              }}
            />
          )}

          {shape === 'star' && (
            <svg width={p.size * 2} height={p.size * 2} viewBox="0 0 24 24" fill={p.col}>
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};
