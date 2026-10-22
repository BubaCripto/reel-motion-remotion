import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {ColorGradePreset} from '../../lib/project';
import {COLOR_GRADE_STYLES} from '../../lib/project';

type Props = {
  grain?: boolean;
  grainOpacity?: number;
  vignette?: boolean;
  vignetteIntensity?: number;
  colorGrade?: ColorGradePreset;
  chromaticAberration?: boolean;
};

export const AnalogTextureOverlay: React.FC<Props> = ({
  grain = true,
  grainOpacity = 0.16,
  vignette = true,
  vignetteIntensity = 0.55,
  colorGrade = 'none',
  chromaticAberration = false
}) => {
  const frame = useCurrentFrame();
  const seed = (frame % 12);
  const shiftX = ((seed * 17) % 7) - 3;
  const shiftY = ((seed * 23) % 7) - 3;

  const grade = COLOR_GRADE_STYLES[colorGrade] || COLOR_GRADE_STYLES.none;

  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {/* 1. Color Grading Tint Overlay */}
      {grade.overlayGradient && (
        <AbsoluteFill
          style={{
            background: grade.overlayGradient,
            mixBlendMode: 'overlay',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* 2. Procedural Film Grain (SVG Turbulence noise) */}
      {grain && (
        <AbsoluteFill
          style={{
            opacity: grainOpacity,
            mixBlendMode: 'screen',
            transform: `translate(${shiftX}px, ${shiftY}px)`,
            pointerEvents: 'none'
          }}
        >
          <svg width="100%" height="100%" style={{width: '100%', height: '100%'}}>
            <filter id={`film-grain-noise-${seed}`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="3"
                stitchTiles="stitch"
                seed={seed}
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 1
                        0 0 0 0 1
                        0 0 0 0 1
                        0 0 0 0.85 0"
              />
            </filter>
            <rect width="100%" height="100%" filter={`url(#film-grain-noise-${seed})`} />
          </svg>
        </AbsoluteFill>
      )}

      {/* 3. Cinematic Vignette */}
      {vignette && (
        <AbsoluteFill
          style={{
            boxShadow: `inset 0 0 380px ${Math.round(vignetteIntensity * 160)}px rgba(0,0,0,${vignetteIntensity})`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* 4. Chromatic Aberration Fringe */}
      {chromaticAberration && (
        <AbsoluteFill
          style={{
            boxShadow: 'inset 3px 0 0 rgba(255, 0, 80, 0.25), inset -3px 0 0 rgba(0, 220, 255, 0.25)',
            mixBlendMode: 'screen',
            pointerEvents: 'none'
          }}
        />
      )}
    </AbsoluteFill>
  );
};
