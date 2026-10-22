import React from 'react';
import { interpolate, spring } from 'remotion';

export interface SvgStrokePathProps {
  shape?: 'curved-arrow' | 'scribble-circle' | 'marker-underline' | 'target-reticle' | 'spiral';
  color?: string;
  strokeWidth?: number;
  angle?: number;
  scale?: number;
  fps?: number;
  frame?: number;
}

export const SvgStrokePath: React.FC<SvgStrokePathProps> = ({
  shape = 'curved-arrow',
  color = '#ffe043',
  strokeWidth = 10,
  angle = 0,
  scale = 1,
  fps = 30,
  frame = 0
}) => {
  const drawSpring = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 120 }
  });

  const arrowHeadSpring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 10, stiffness: 160 }
  });

  switch (shape) {
    case 'curved-arrow': {
      const pathLength = 680;
      const dashOffset = pathLength * (1 - drawSpring);
      const arrowOpacity = interpolate(arrowHeadSpring, [0, 0.2, 1], [0, 1, 1]);
      return (
        <svg
          viewBox="0 0 500 300"
          style={{
            width: `${480 * scale}px`,
            height: `${280 * scale}px`,
            overflow: 'visible',
            transform: `rotate(${angle}deg)`,
            pointerEvents: 'none'
          }}
        >
          {/* Main Curved Tail */}
          <path
            d="M 50 240 C 120 40, 320 20, 420 180"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={dashOffset}
          />
          {/* Arrow Head */}
          <g
            style={{
              opacity: arrowOpacity,
              transformOrigin: '420px 180px',
              transform: `scale(${arrowHeadSpring})`
            }}
          >
            <path
              d="M 375 145 L 420 180 L 428 125"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      );
    }

    case 'scribble-circle': {
      const circleLength = 1600;
      const dashOffset = circleLength * (1 - drawSpring);
      return (
        <svg
          viewBox="0 0 400 400"
          style={{
            width: `${380 * scale}px`,
            height: `${380 * scale}px`,
            overflow: 'visible',
            transform: `rotate(${angle}deg)`,
            pointerEvents: 'none'
          }}
        >
          <path
            d="M 200 40 C 330 35, 370 180, 360 280 C 340 370, 160 380, 80 320 C 10 240, 20 100, 150 50 C 270 10, 390 120, 370 260"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circleLength}
            strokeDashoffset={dashOffset}
          />
        </svg>
      );
    }

    case 'marker-underline': {
      const lineLength = 500;
      const dashOffset = lineLength * (1 - drawSpring);
      return (
        <svg
          viewBox="0 0 500 80"
          style={{
            width: `${460 * scale}px`,
            height: `${70 * scale}px`,
            overflow: 'visible',
            transform: `rotate(${angle}deg)`,
            pointerEvents: 'none'
          }}
        >
          <path
            d="M 20 45 Q 150 65, 260 40 T 480 48"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 1.4}
            strokeLinecap="round"
            strokeDasharray={lineLength}
            strokeDashoffset={dashOffset}
          />
        </svg>
      );
    }

    case 'target-reticle': {
      const reticleSpring = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
      const rot = interpolate(frame, [0, 60], [0, 90]);
      const cornerLen = 45 * reticleSpring;
      return (
        <svg
          viewBox="0 0 300 300"
          style={{
            width: `${280 * scale}px`,
            height: `${280 * scale}px`,
            overflow: 'visible',
            transform: `scale(${reticleSpring})`,
            pointerEvents: 'none'
          }}
        >
          {/* Top-Left */}
          <path d={`M 30 ${30 + cornerLen} L 30 30 L ${30 + cornerLen} 30`} fill="none" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" />
          {/* Top-Right */}
          <path d={`M ${270 - cornerLen} 30 L 270 30 L 270 ${30 + cornerLen}`} fill="none" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" />
          {/* Bottom-Left */}
          <path d={`M 30 ${270 - cornerLen} L 30 270 L ${30 + cornerLen} 270`} fill="none" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" />
          {/* Bottom-Right */}
          <path d={`M ${270 - cornerLen} 270 L 270 270 L 270 ${270 - cornerLen}`} fill="none" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" />
          {/* Center Crosshair */}
          <g transform={`rotate(${rot} 150 150)`}>
            <circle cx="150" cy="150" r="35" fill="none" stroke={color} strokeWidth={strokeWidth * 0.5} strokeDasharray="6 6" />
            <line x1="150" y1="95" x2="150" y2="125" stroke={color} strokeWidth={strokeWidth * 0.6} strokeLinecap="round" />
            <line x1="150" y1="175" x2="150" y2="205" stroke={color} strokeWidth={strokeWidth * 0.6} strokeLinecap="round" />
            <line x1="95" y1="150" x2="125" y2="150" stroke={color} strokeWidth={strokeWidth * 0.6} strokeLinecap="round" />
            <line x1="175" y1="150" x2="205" y2="150" stroke={color} strokeWidth={strokeWidth * 0.6} strokeLinecap="round" />
          </g>
        </svg>
      );
    }

    case 'spiral':
    default: {
      const spiralLength = 1200;
      const dashOffset = spiralLength * (1 - drawSpring);
      return (
        <svg
          viewBox="0 0 300 300"
          style={{
            width: `${260 * scale}px`,
            height: `${260 * scale}px`,
            overflow: 'visible',
            transform: `rotate(${angle + frame * 2}deg)`,
            pointerEvents: 'none'
          }}
        >
          <path
            d="M 150 150 m 0 0 a 15 15 0 0 1 20 20 a 35 35 0 0 1 -45 10 a 60 60 0 0 1 10 -75 a 90 90 0 0 1 100 20 a 125 125 0 0 1 -35 140"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={spiralLength}
            strokeDashoffset={dashOffset}
          />
        </svg>
      );
    }
  }
};
