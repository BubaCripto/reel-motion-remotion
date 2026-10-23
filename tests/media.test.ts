import test from 'node:test';
import assert from 'node:assert/strict';
import {collectProjectMedia, isManagedMedia, relinkProjectMedia} from '../src/lib/media.ts';
import {createBlankProject} from '../src/lib/project.ts';

test('media inventory groups repeated clip sources and relinks without touching timing', () => {
  const project = createBlankProject('Mídia', {clips: [
    {id: 'a', src: '/media/source.mp4', start: 0, end: 2, sourceStart: 0, speed: 1},
    {id: 'b', src: '/media/source.mp4', start: 2, end: 4, sourceStart: 2, speed: 1}
  ], overlays: [{id:'logo', kind:'image', name:'Logo', src:'/media/logo.png', start:0, end:4, track:3, x:50, y:50, scale:1, rotation:0, opacity:1}]});
  assert.deepEqual(collectProjectMedia(project).map(item => [item.src, item.uses]), [['/media/source.mp4', 2], ['/media/logo.png', 1]]);
  const updated = relinkProjectMedia(project, '/media/source.mp4', '/media/new-source.mp4');
  assert.equal(updated.clips[1].start, 2);
  assert.equal(updated.clips[0].src, '/media/new-source.mp4');
  assert.equal(isManagedMedia('/media/new-source.mp4'), true);
  assert.equal(isManagedMedia('https://invalid.example/file.mp4'), false);
});
