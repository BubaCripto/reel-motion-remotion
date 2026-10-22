import React from 'react';
import { interpolate, spring } from 'remotion';

export interface RocketLaunchSceneProps {
  color?: string;
  fps?: number;
  frame?: number;
}

export const RocketLaunchScene: React.FC<RocketLaunchSceneProps> = ({
  color = '#ffe043',
  fps = 30,
  frame = 0
}) => {
  const flightSpring = spring({ frame, fps, config: { damping: 10, stiffness: 80, mass: 0.9 } });
  const posX = interpolate(flightSpring, [0, 1], [-180, 40]);
  const posY = interpolate(flightSpring, [0, 1], [180, -40]);

  const smokePuffs = [
    { delay: 4, size: 28, x: -35, y: 35 },
    { delay: 8, size: 42, x: -70, y: 70 },
    { delay: 12, size: 55, x: -110, y: 110 }
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '400px',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      {/* Smoke Clouds Trail */}
      {smokePuffs.map((puff, i) => {
        const puffSpring = spring({ frame: frame - puff.delay, fps, config: { damping: 12, stiffness: 100 } });
        const puffOpacity = interpolate(puffSpring, [0, 0.4, 1], [0, 0.7, 0]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${puff.x}px)`,
              top: `calc(50% + ${puff.y}px)`,
              width: `${puff.size}px`,
              height: `${puff.size}px`,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.65)',
              filter: 'blur(6px)',
              transform: `scale(${puffSpring * 1.5})`,
              opacity: puffOpacity
            }}
          />
        );
      })}

      {/* Ascending Rocket */}
      <div
        style={{
          position: 'absolute',
          transform: `translate(${posX}px, ${posY}px) rotate(45deg)`,
          filter: `drop-shadow(0 0 20px ${color})`
        }}
      >
        <svg viewBox="0 0 100 100" width="120" height="120">
          {/* Flame Exhaust */}
          <polygon
            points="50,85 42,100 50,95 58,100"
            fill="#ff0055"
            transform={`scale(${1 + Math.sin(frame * 1.2) * 0.25})`}
            style={{ transformOrigin: '50px 85px' }}
          />
          <polygon
            points="50,85 45,96 50,92 55,96"
            fill={color}
            transform={`scale(${1 + Math.sin(frame * 1.5) * 0.3})`}
            style={{ transformOrigin: '50px 85px' }}
          />

          {/* Rocket Body */}
          <path
            d="M 50 15 Q 65 35 65 70 L 35 70 Q 35 35 50 15 Z"
            fill="#ffffff"
            stroke="#222"
            strokeWidth="3"
          />

          {/* Nose Tip */}
          <path d="M 50 15 Q 58 28 58 35 L 42 35 Q 42 28 50 15 Z" fill="#ff0055" />

          {/* Wings */}
          <polygon points="35,55 20,75 35,70" fill={color} />
          <polygon points="65,55 80,75 65,70" fill={color} />

          {/* Porthole */}
          <circle cx="50" cy="46" r="8" fill="#00f0ff" stroke="#222" strokeWidth="2.5" />
        </svg>
      </div>
    </div>
  );
};
