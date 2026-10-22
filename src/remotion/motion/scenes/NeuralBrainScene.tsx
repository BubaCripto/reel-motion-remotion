import React from 'react';
import { interpolate, spring } from 'remotion';

export interface NeuralBrainSceneProps {
  label?: string;
  color?: string;
  fps?: number;
  frame?: number;
}

export const NeuralBrainScene: React.FC<NeuralBrainSceneProps> = ({
  label = 'CONEXÃO NEURAL',
  color = '#00f0ff',
  fps = 30,
  frame = 0
}) => {
  const enterSpring = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });

  const nodes = [
    { cx: 80, cy: 110 },
    { cx: 140, cy: 60 },
    { cx: 200, cy: 90 },
    { cx: 160, cy: 150 },
    { cx: 240, cy: 130 },
    { cx: 110, cy: 190 },
    { cx: 220, cy: 200 }
  ];

  const connections = [
    [0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [0, 5], [3, 5], [4, 6], [5, 6]
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${enterSpring})`,
        pointerEvents: 'none'
      }}
    >
      <svg viewBox="0 0 300 240" width="320" height="250" style={{ overflow: 'visible' }}>
        {/* Synaptic Lines */}
        {connections.map(([a, b], idx) => {
          const nA = nodes[a];
          const nB = nodes[b];
          const pulse = (Math.sin(frame * 0.4 + idx) + 1) / 2;
          return (
            <line
              key={idx}
              x1={nA.cx}
              y1={nA.cy}
              x2={nB.cx}
              y2={nB.cy}
              stroke={color}
              strokeWidth={2 + pulse * 2.5}
              strokeOpacity={0.3 + pulse * 0.7}
              strokeLinecap="round"
              style={{ filter: pulse > 0.6 ? `drop-shadow(0 0 6px ${color})` : undefined }}
            />
          );
        })}

        {/* Neural Nodes */}
        {nodes.map((node, i) => {
          const nPulse = (Math.sin(frame * 0.5 + i * 1.5) + 1) / 2;
          return (
            <g key={i}>
              <circle
                cx={node.cx}
                cy={node.cy}
                r={6 + nPulse * 4}
                fill={color}
                style={{ filter: `drop-shadow(0 0 10px ${color})` }}
              />
              <circle cx={node.cx} cy={node.cy} r={2} fill="#ffffff" />
            </g>
          );
        })}
      </svg>

      <div
        style={{
          marginTop: '8px',
          padding: '6px 18px',
          borderRadius: '999px',
          background: 'rgba(5, 10, 20, 0.85)',
          border: `2px solid ${color}`,
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '18px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          boxShadow: `0 0 16px ${color}66`
        }}
      >
        {label}
      </div>
    </div>
  );
};
