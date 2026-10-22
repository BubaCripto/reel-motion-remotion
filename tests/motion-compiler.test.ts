import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProject, type Cue } from '../src/lib/project.ts';
import {
  generateSemanticMotionBlueprint,
  applyDirectorBlueprint,
  type DirectorBlueprint
} from '../src/lib/motionCompiler.ts';

test('generateSemanticMotionBlueprint produces hook, semantic scenes and CTA', () => {
  const cues: Cue[] = [
    { id: 'c1', start: 0, end: 2.2, text: 'Você comete o [PIOR ERRO] do marketing' },
    { id: 'c2', start: 2.4, end: 5.0, text: 'Minha receita [CRESCEU 300%] no último mês' },
    { id: 'c3', start: 5.2, end: 8.0, text: 'Acelere 10x mais [RÁPIDO] que os concorrentes' },
    { id: 'c4', start: 8.2, end: 11.5, text: 'Essa é a [ESTRATÉGIA] secreta para o seu negócio' }
  ];

  const blueprint = generateSemanticMotionBlueprint(cues, 'viral-after-effects', 'aggressive', 12);

  assert.ok(blueprint.motionLayers.length >= 4);
  assert.ok(blueprint.soundDesign.length >= 4);
  assert.equal(blueprint.cameraPunches.length, 1);
  assert.equal(blueprint.cameraPunches[0].transition, 'flash');

  // Verify semantic scene types were triggered
  const sceneTypes = blueprint.motionLayers
    .filter(m => m.type === 'scene')
    .map(m => m.motionProps?.scene);

  assert.ok(sceneTypes.includes('growth-graph'));
  assert.ok(sceneTypes.includes('rocket-launch')); // CTA
});

test('generateSemanticMotionBlueprint respects intensity levels', () => {
  const cues: Cue[] = [
    { id: 'c1', start: 0, end: 2.5, text: 'Introdução do vídeo' },
    { id: 'c2', start: 3, end: 6, text: 'Frase normal número um' },
    { id: 'c3', start: 7, end: 10, text: 'Frase normal número dois' },
    { id: 'c4', start: 11, end: 14, text: 'Frase de fechamento' }
  ];

  const subtle = generateSemanticMotionBlueprint(cues, 'minimalist-editorial', 'subtle', 15);
  const aggressive = generateSemanticMotionBlueprint(cues, 'viral-after-effects', 'aggressive', 15);

  assert.ok(aggressive.motionLayers.length > subtle.motionLayers.length);
});

test('applyDirectorBlueprint injects motion and sound overlays and updates clips', () => {
  const blueprint: DirectorBlueprint = {
    directorVision: 'Test vision',
    style: 'viral-after-effects',
    intensity: 'balanced',
    cameraPunches: [{ time: 0, scale: 1.2, transition: 'whip-right' }],
    motionLayers: [
      {
        id: 'm-1',
        type: 'scene',
        name: 'Growth Scene',
        start: 1,
        end: 4,
        x: 50,
        y: 35,
        scale: 1,
        color: '#ffe043',
        motionProps: { scene: 'growth-graph', metric: '+100%' }
      }
    ],
    soundDesign: [
      { time: 1, sfx: 'coin-ding', volume: 0.8 }
    ]
  };

  const projectWithClip = {
    ...initialProject,
    clips: [{ id: 'clip-1', src: '/video.mp4', start: 0, end: 10, sourceStart: 0, speed: 1 }],
    overlays: []
  };

  const result = applyDirectorBlueprint(projectWithClip, blueprint, { replaceExistingMotion: true });

  // Check clip updated
  assert.equal(result.clips[0].zoom, 1.2);
  assert.equal(result.clips[0].transition?.type, 'whip-right');

  // Check motion layer
  const motionLayer = result.overlays.find(o => o.kind === 'motion');
  assert.ok(motionLayer);
  assert.equal(motionLayer.motionType, 'scene');
  assert.equal(motionLayer.motionProps?.scene, 'growth-graph');

  // Check audio layer
  const audioLayer = result.overlays.find(o => o.kind === 'audio');
  assert.ok(audioLayer);
  assert.equal(audioLayer.src, '/sfx/coin-ding.wav');
  assert.equal(audioLayer.volume, 0.8);
});

test('applyDirectorBlueprint with replaceExistingMotion replaces only previous motion and sfx', () => {
  const existingUserLogo = {
    id: 'user-logo',
    kind: 'image' as const,
    name: 'Logo',
    start: 0,
    end: 10,
    track: 2,
    x: 10,
    y: 10,
    scale: 1,
    rotation: 0,
    opacity: 1
  };
  const oldMotion = {
    id: 'old-m',
    kind: 'motion' as const,
    name: 'Old',
    start: 0,
    end: 2,
    track: 3,
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    opacity: 1
  };
  const oldSfx = {
    id: 'old-sfx',
    kind: 'audio' as const,
    name: 'Old Sfx',
    src: '/sfx/whoosh-fast.wav',
    start: 0,
    end: 1,
    track: 0,
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
    opacity: 1
  };

  const p = {
    ...initialProject,
    overlays: [existingUserLogo, oldMotion, oldSfx]
  };

  const newBlueprint: DirectorBlueprint = {
    directorVision: 'New',
    style: 'cyber-tech',
    intensity: 'balanced',
    cameraPunches: [],
    motionLayers: [
      {
        id: 'new-m',
        type: 'burst',
        name: 'New Burst',
        start: 1,
        end: 2,
        x: 50,
        y: 40,
        scale: 1,
        motionProps: { count: 8 }
      }
    ],
    soundDesign: []
  };

  const result = applyDirectorBlueprint(p, newBlueprint, { replaceExistingMotion: true });

  assert.ok(result.overlays.some(o => o.id === 'user-logo')); // Preserved
  assert.ok(!result.overlays.some(o => o.id === 'old-m')); // Removed
  assert.ok(!result.overlays.some(o => o.id === 'old-sfx')); // Removed
  assert.ok(result.overlays.some(o => o.id === 'new-m')); // Added
});
