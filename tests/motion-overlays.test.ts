import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProject, validateProject, durationFrames, type Overlay } from '../src/lib/project.ts';

test('validateProject accepts and preserves motion overlays', () => {
  const motionLayer: Overlay = {
    id: 'motion-1',
    kind: 'motion',
    motionType: 'kinetic-text',
    name: 'Kinetic 3D Punch',
    start: 2,
    end: 5.5,
    track: 3,
    x: 50,
    y: 35,
    scale: 1,
    rotation: 0,
    opacity: 1,
    motionProps: {
      text: 'RESULTADO REAL',
      style: '3d-tilt',
      accent: '#00f0ff',
      backdropWord: 'GROWTH'
    }
  };

  const p = validateProject({
    ...initialProject,
    overlays: [motionLayer]
  });

  assert.equal(p.overlays.length, 1);
  assert.equal(p.overlays[0].kind, 'motion');
  assert.equal(p.overlays[0].motionType, 'kinetic-text');
  assert.equal(p.overlays[0].motionProps?.text, 'RESULTADO REAL');
  assert.equal(p.overlays[0].motionProps?.style, '3d-tilt');
});

test('durationFrames accounts for motion overlay boundaries', () => {
  const p = {
    ...initialProject,
    videoDuration: 0,
    cues: [],
    clips: [],
    overlays: [
      {
        id: 'motion-scene-1',
        kind: 'motion' as const,
        motionType: 'scene' as const,
        name: 'Growth Scene',
        start: 12,
        end: 18.5,
        track: 2,
        x: 50,
        y: 40,
        scale: 1,
        rotation: 0,
        opacity: 1,
        motionProps: { scene: 'growth-graph', metric: '+500%' }
      }
    ]
  };

  const frames = durationFrames(p);
  assert.equal(frames, Math.ceil(18.5 * p.fps));
});

test('multiple motion overlay types co-exist without collision or loss', () => {
  const layers: Overlay[] = [
    {
      id: 'm1',
      kind: 'motion',
      motionType: 'stroke-path',
      name: 'Curved Arrow',
      start: 0,
      end: 3,
      track: 2,
      x: 70,
      y: 40,
      scale: 1,
      rotation: 0,
      opacity: 1,
      motionProps: { shape: 'curved-arrow', color: '#ffe043' }
    },
    {
      id: 'm2',
      kind: 'motion',
      motionType: 'burst',
      name: 'Star Burst',
      start: 2.8,
      end: 4.2,
      track: 3,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      motionProps: { count: 16, shape: 'star' }
    },
    {
      id: 'm3',
      kind: 'motion',
      motionType: 'camera-shake',
      name: 'Impact Shake',
      start: 2.8,
      end: 3.3,
      track: 4,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      motionProps: { intensity: 20 }
    }
  ];

  const p = validateProject({
    ...initialProject,
    overlays: layers
  });

  assert.equal(p.overlays.length, 3);
  assert.equal(p.overlays[0].motionType, 'stroke-path');
  assert.equal(p.overlays[1].motionType, 'burst');
  assert.equal(p.overlays[2].motionType, 'camera-shake');
});
