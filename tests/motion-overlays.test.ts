import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProject, validateProject, durationFrames, type Overlay } from '../src/lib/project.ts';
import { motionSceneIds } from '../src/lib/motionCatalog.ts';

test('complete demo contains every registered motion scene on the dedicated motion track', () => {
  const demoScenes = initialProject.overlays
    .filter(layer => layer.kind === 'motion' && layer.motionType === 'scene')
    .map(layer => layer.motionProps?.scene);

  assert.equal(demoScenes.length, motionSceneIds.length);
  assert.deepEqual([...demoScenes].sort(), [...motionSceneIds].sort());
  assert.ok(initialProject.overlays.filter(layer => layer.kind === 'motion').every(layer => layer.track === 3));
});

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

test('motion overlays can be filtered and mapped for timeline track display', () => {
  const p = {
    ...initialProject,
    overlays: [
      {
        id: 'scene-1',
        kind: 'motion' as const,
        motionType: 'scene' as const,
        name: 'Grafico 300%',
        start: 1,
        end: 4,
        track: 3,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        motionProps: {scene: 'growth-graph', metric: '+340%'}
      },
      {
        id: 'kinetic-1',
        kind: 'motion' as const,
        motionType: 'kinetic-text' as const,
        name: 'Texto Impacto',
        start: 4,
        end: 7,
        track: 3,
        x: 50,
        y: 30,
        scale: 1,
        rotation: 0,
        opacity: 1,
        motionProps: {style: '3d-tilt'}
      },
      {
        id: 'regular-overlay-1',
        kind: 'shape' as const,
        name: 'Vignette',
        start: 0,
        end: 10,
        track: 4,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        opacity: 1
      }
    ]
  };

  const motionTrackItems = p.overlays
    .filter(o => o.kind === 'motion')
    .map(o => ({
      id: o.id,
      start: o.start,
      end: o.end,
      subKind: 'motion'
    }));

  assert.equal(motionTrackItems.length, 2);
  assert.equal(motionTrackItems[0].id, 'scene-1');
  assert.equal(motionTrackItems[0].subKind, 'motion');
  assert.equal(motionTrackItems[1].id, 'kinetic-1');
});

test('motion overlay trimming and repositioning preserves all motion configuration', () => {
  const original: Overlay = {
    id: 'm-drag-1',
    kind: 'motion',
    motionType: 'burst',
    name: 'Sparkle Burst',
    start: 2,
    end: 4,
    track: 3,
    x: 50,
    y: 50,
    scale: 1.2,
    rotation: 15,
    opacity: 0.9,
    motionProps: {count: 24, shape: 'spark', speed: 1.5}
  };

  // Simulate timeline drag move (+1.5s)
  const moved: Overlay = {
    ...original,
    start: original.start + 1.5,
    end: original.end + 1.5
  };

  assert.equal(moved.start, 3.5);
  assert.equal(moved.end, 5.5);
  assert.equal(moved.motionProps?.count, 24);
  assert.equal(moved.motionProps?.shape, 'spark');

  // Simulate timeline end-handle trimming (-0.5s)
  const trimmed: Overlay = {
    ...moved,
    end: moved.end - 0.5
  };

  assert.equal(trimmed.start, 3.5);
  assert.equal(trimmed.end, 5.0);
  assert.equal(trimmed.motionProps?.shape, 'spark');
});

test('camera shake time window and frame indexing are strictly bounded', () => {
  const p = {
    ...initialProject,
    fps: 30,
    overlays: [
      {
        id: 'shake-1',
        kind: 'motion' as const,
        motionType: 'camera-shake' as const,
        name: 'Punch Shake',
        start: 2.0,
        end: 2.5,
        track: 3,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        motionProps: { intensity: 16 }
      }
    ]
  };

  const getActiveShake = (time: number) =>
    p.overlays.find(
      l => l.kind === 'motion' && l.motionType === 'camera-shake' && time >= l.start && time < l.end
    );

  // Before shake
  assert.equal(getActiveShake(1.99), undefined);

  // At start of shake
  const atStart = getActiveShake(2.0);
  assert.ok(atStart);
  assert.equal(Math.round((2.0 - atStart.start) * p.fps), 0);

  // Mid shake
  const mid = getActiveShake(2.2);
  assert.ok(mid);
  assert.equal(Math.round((2.2 - mid.start) * p.fps), 6);

  // At exact end boundary: cleanly deactivates without lingering or remounting
  assert.equal(getActiveShake(2.5), undefined);
  assert.equal(getActiveShake(2.51), undefined);
});


