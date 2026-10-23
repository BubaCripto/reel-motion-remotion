import test from 'node:test';
import assert from 'node:assert/strict';
import {isRenderableAsset} from '../server/render-assets.ts';
import {applyDirectorBlueprint, generateSemanticMotionBlueprint} from '../src/lib/motionCompiler.ts';
import {createBlankProject, type Cue} from '../src/lib/project.ts';

test('renderer accepts bundled SFX alongside editor-imported media', () => {
  assert.equal(isRenderableAsset('/sfx/camera-click.wav'), true);
  assert.equal(isRenderableAsset('/media/dfeaa652-99ee-48b4-9755-de06c038c9a5-preview.mp4'), true);
});

test('renderer rejects unknown and unsafe asset references', () => {
  assert.equal(isRenderableAsset('/sfx/not-in-library.wav'), false);
  assert.equal(isRenderableAsset('/media/../secreto.mp4'), false);
  assert.equal(isRenderableAsset('https://example.com/video.mp4'), false);
});

test('a new project generated with motion direction keeps all of its bundled SFX renderable', () => {
  const cues: Cue[] = [
    {id: 'hook', start: 0, end: 2, text: 'Veja este resultado de vendas'},
    {id: 'cta', start: 4, end: 6, text: 'Salve e siga para mais dicas'}
  ];
  const project = applyDirectorBlueprint(
    createBlankProject('Novo Reel', {videoDuration: 6, cues, clips: [], overlays: []}),
    generateSemanticMotionBlueprint(cues, 'viral-after-effects', 'balanced', 6)
  );
  const refs = project.overlays.map(layer => layer.src).filter(Boolean);

  assert.ok(refs.some(src => String(src).startsWith('/sfx/')));
  assert.ok(refs.every(src => isRenderableAsset(src)));
});
