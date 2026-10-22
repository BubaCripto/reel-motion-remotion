import React from 'react';
import { interpolate, spring } from 'remotion';

export interface KineticTypographyProps {
  text: string;
  motionStyle?: '3d-tilt' | 'elastic-bounce' | 'stagger-drop' | 'backdrop-stroke' | 'squash-stretch';
  accent?: string;
  color?: string;
  fontA?: string;
  fontB?: string;
  outline?: boolean;
  backdropWord?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  fps?: number;
  frame?: number;
}

export const KineticTypography: React.FC<KineticTypographyProps> = ({
  text,
  motionStyle = '3d-tilt',
  accent = '#ffe043',
  color = '#ffffff',
  fontA = 'Anton',
  outline = true,
  backdropWord,
  fontSize = 110,
  align = 'center',
  fps = 30,
  frame = 0
}) => {
  const words = text.trim().split(/\s+/);
  const letters = text.split('');

  // Primary spring animation
  const mainSpring = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 140, mass: 0.8 }
  });

  // Squash & stretch calculation
  const scaleX = 1 + Math.sin(frame * 0.4) * Math.max(0, 1 - mainSpring) * 0.45;
  const scaleY = 1 - Math.sin(frame * 0.4) * Math.max(0, 1 - mainSpring) * 0.35;

  let transformStyle = '';
  switch (motionStyle) {
    case '3d-tilt': {
      const rotX = interpolate(mainSpring, [0, 1], [35, 0]);
      const rotY = interpolate(mainSpring, [0, 1], [-25, 0]);
      const sc = interpolate(mainSpring, [0, 1], [0.4, 1]);
      transformStyle = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${sc})`;
      break;
    }
    case 'elastic-bounce': {
      const sc = interpolate(mainSpring, [0, 1], [0.2, 1]);
      const y = interpolate(mainSpring, [0, 1], [-120, 0]);
      transformStyle = `translateY(${y}px) scale(${sc})`;
      break;
    }
    case 'squash-stretch': {
      transformStyle = `scale(${mainSpring}) scale(${scaleX}, ${scaleY})`;
      break;
    }
    case 'stagger-drop':
    case 'backdrop-stroke':
    default: {
      const y = interpolate(mainSpring, [0, 1], [60, 0]);
      transformStyle = `translateY(${y}px) scale(${mainSpring})`;
      break;
    }
  }

  const strokeStyle = outline ? `4px ${accent}` : undefined;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        justifyContent: 'center',
        textAlign: align,
        width: '100%',
        pointerEvents: 'none'
      }}
    >
      {/* Optional Giant Backdrop Outline Word */}
      {backdropWord && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: fontSize * 1.7,
            fontFamily: fontA,
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'transparent',
            WebkitTextStroke: '2px rgba(255, 255, 255, 0.18)',
            letterSpacing: '8px',
            lineHeight: 0.8,
            zIndex: 0,
            whiteSpace: 'nowrap',
            opacity: interpolate(mainSpring, [0, 1], [0, 0.75])
          }}
        >
          {backdropWord}
        </div>
      )}

      {/* Main Foreground Kinetic Text */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: fontA,
          fontSize,
          fontWeight: 900,
          color,
          letterSpacing: '-2px',
          lineHeight: 0.95,
          textTransform: 'uppercase',
          textShadow: '0 8px 24px rgba(0,0,0,0.85)',
          WebkitTextStroke: strokeStyle,
          paintOrder: 'stroke fill',
          transform: transformStyle
        }}
      >
        {motionStyle === 'stagger-drop' ? (
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '4px' }}>
            {letters.map((char, idx) => {
              const letterSpring = spring({
                frame: frame - idx * 1.5,
                fps,
                config: { damping: 10, stiffness: 180 }
              });
              const lY = interpolate(letterSpring, [0, 1], [-80, 0]);
              return (
                <span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    transform: `translateY(${lY}px) scale(${letterSpring})`,
                    opacity: interpolate(letterSpring, [0, 0.2, 1], [0, 1, 1])
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>
        ) : (
          words.map((word, wIdx) => {
            const isHighlight = wIdx % 2 === 1;
            return (
              <span
                key={wIdx}
                style={{
                  color: isHighlight ? accent : color,
                  margin: '0 8px',
                  display: 'inline-block'
                }}
              >
                {word}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
};
