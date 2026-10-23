import React from 'react';
import { interpolate } from 'remotion';

export interface CameraShakeWrapperProps {
  active?: boolean;
  intensity?: number;
  decayFrames?: number;
  frame?: number;
  children: React.ReactNode;
}

export const CameraShakeWrapper: React.FC<CameraShakeWrapperProps> = ({
  active = true,
  intensity = 18,
  decayFrames = 10,
  frame = 0,
  children
}) => {
  const isShaking = active && frame >= 0 && frame < decayFrames;

  let transform: string | undefined = undefined;

  if (isShaking) {
    const damping = interpolate(frame, [0, decayFrames], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    });

    const shakeX = Math.sin(frame * 2.1) * intensity * damping;
    const shakeY = Math.cos(frame * 1.7) * (intensity * 0.7) * damping;
    const shakeRot = Math.sin(frame * 1.3) * (intensity * 0.08) * damping;
    // Edge compensation: smooth 1.04x scale during shake to guarantee video edges never reveal black bars
    const shakeScale = 1 + 0.04 * damping;

    transform = `translate(${shakeX.toFixed(2)}px, ${shakeY.toFixed(2)}px) rotate(${shakeRot.toFixed(2)}deg) scale(${shakeScale.toFixed(3)})`;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        transform,
        transformOrigin: 'center center'
      }}
    >
      {children}
    </div>
  );
};

