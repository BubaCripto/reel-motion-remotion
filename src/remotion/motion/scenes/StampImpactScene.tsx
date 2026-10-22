import React from 'react';
import { interpolate, spring } from 'remotion';

export interface StampImpactSceneProps {
  text?: string;
  color?: string;
  subtext?: string;
  fps?: number;
  frame?: number;
}

export const StampImpactScene: React.FC<StampImpactSceneProps> = ({
  text = 'NUNCA FAÇA!',
  color = '#ff0055',
  subtext = 'ERRO GRAVE DETECTADO',
  fps = 30,
  frame = 0
}) => {
  const stampSpring = spring({ frame, fps, config: { damping: 9, stiffness: 220, mass: 0.7 } });
  const scale = interpolate(stampSpring, [0, 1], [3.2, 1]);
  const rot = interpolate(stampSpring, [0, 1], [-25, -6]);

  // Squash on landing
  const squashX = 1 + Math.sin(frame * 0.5) * Math.max(0, 1 - stampSpring) * 0.35;
  const squashY = 1 - Math.sin(frame * 0.5) * Math.max(0, 1 - stampSpring) * 0.25;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px 38px',
          border: `8px dashed ${color}`,
          borderRadius: '16px',
          background: 'rgba(20, 5, 10, 0.7)',
          boxShadow: `0 0 40px ${color}88, inset 0 0 20px ${color}33`,
          transform: `scale(${scale}) rotate(${rot}deg) scale(${squashX}, ${squashY})`,
          transformOrigin: 'center center'
        }}
      >
        <span
          style={{
            fontFamily: 'Impact, Anton, sans-serif',
            fontSize: '78px',
            fontWeight: 900,
            color,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            lineHeight: 1,
            textShadow: `0 0 20px ${color}`
          }}
        >
          {text}
        </span>
        {subtext && (
          <span
            style={{
              fontFamily: 'sans-serif',
              fontSize: '18px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginTop: '6px'
            }}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
