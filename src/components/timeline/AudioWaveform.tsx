import React, {useEffect, useRef, useState} from 'react';
import {getAudioPeaks} from '../../services/audioWaveform';

type AudioWaveformProps = {
  src: string;
  start: number;
  end: number;
  sourceStart?: number;
  speed?: number;
  zoom: number;
  height?: number;
  color?: string;
};

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  src,
  start,
  end,
  sourceStart = 0,
  speed = 1,
  zoom,
  height = 24,
  color = '#22d3ee'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);

  useEffect(() => {
    let active = true;
    getAudioPeaks(src).then(result => {
      if (active) setPeaks(result);
    });
    return () => {
      active = false;
    };
  }, [src]);

  const width = Math.max(10, Math.round((end - start) * zoom));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks || peaks.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const samplesPerSecond = 50;
    const clipDuration = end - start;
    const sourceDuration = clipDuration * speed;

    const startSample = Math.max(0, Math.floor(sourceStart * samplesPerSecond));
    const endSample = Math.min(peaks.length, Math.floor((sourceStart + sourceDuration) * samplesPerSecond));
    const totalSamples = Math.max(1, endSample - startSample);

    const barWidth = 2;
    const gap = 1;
    const step = barWidth + gap;
    const numBars = Math.floor(width / step);

    const midY = height / 2;
    ctx.fillStyle = color;

    for (let b = 0; b < numBars; b++) {
      const sampleIndex = startSample + Math.floor((b / numBars) * totalSamples);
      const val = sampleIndex < peaks.length ? peaks[sampleIndex] : 0;
      const barHeight = Math.max(2, val * (height - 4));
      const x = b * step;
      const y = midY - barHeight / 2;

      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [peaks, width, height, start, end, sourceStart, speed, color]);

  if (!peaks) return null;

  return (
    <canvas
      ref={canvasRef}
      className="audioWaveformCanvas"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        pointerEvents: 'none',
        opacity: 0.45,
        zIndex: 0
      }}
    />
  );
};
