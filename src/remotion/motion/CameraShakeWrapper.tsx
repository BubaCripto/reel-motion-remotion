import React from 'react';
import { interpolate } from 'remotion';

export interface CameraShakeWrapperProps {
  intensity?: number;
  decayFrames?: number;
  frame?: number;
  children: React.ReactNode;
}

export const CameraShakeWrapper: React.FC<CameraShakeWrapperProps> = ({
  intensity = 18,
  decayFrames = 10,
  frame = 0,
  children
}) => {
  if (frame < 0 || frame >= decayFrames) {
    return <>{children}</>;
  }

  const damping = interpolate(frame, [0, decayFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const shakeX = Math.sin(frame * 2.1) * intensity * damping;
  const shakeY = Math.cos(frame * 1.7) * (intensity * 0.7) * damping;
  const shakeRot = Math.sin(frame * 1.3) * (intensity * 0.08) * damping;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform: `translate(${shakeX}px, ${shakeY}px) rotate(${shakeRot}deg)`,
        transformOrigin: 'center center'
      }}
    >
      {children}
    </div>
  );
};
