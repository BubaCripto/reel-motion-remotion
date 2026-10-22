import test from 'node:test';
import assert from 'node:assert/strict';
import {ASPECT_RATIOS, COLOR_GRADE_STYLES, type AspectRatioPreset, type Cue} from '../src/lib/project.ts';

test('aspect ratio configurations define exact pixel dimensions', () => {
  assert.deepEqual(ASPECT_RATIOS['9:16'], {width: 1080, height: 1920, label: '9:16 (Reels/TikTok)'});
  assert.deepEqual(ASPECT_RATIOS['4:5'], {width: 1080, height: 1350, label: '4:5 (Feed Portrait)'});
  assert.deepEqual(ASPECT_RATIOS['1:1'], {width: 1080, height: 1080, label: '1:1 (Feed Quadrado)'});
  assert.deepEqual(ASPECT_RATIOS['16:9'], {width: 1920, height: 1080, label: '16:9 (YouTube)'});
});

test('color grading styles provide distinct aesthetic CSS filters and overlays', () => {
  const grades = ['none', 'teal-orange', 'moody-dark', 'clean-bright', 'cyber-neon', 'monochrome'] as const;
  for (const g of grades) {
    const style = COLOR_GRADE_STYLES[g];
    assert.ok(style, `Style for ${g} should exist`);
    assert.ok(typeof style.filter === 'string', `Filter for ${g} should be a string`);
    if (g !== 'none') {
      assert.notEqual(style.filter, 'none');
      assert.ok(style.overlayGradient, `Overlay gradient for ${g} should exist`);
    }
  }
});

test('smart audio ducking identifies active speech intervals accurately', () => {
  const cues: Cue[] = [
    {id: 'c1', start: 1.0, end: 3.5, text: 'Primeira frase'},
    {id: 'c2', start: 5.0, end: 8.0, text: 'Segunda frase'}
  ];

  const isDucking = (now: number, cuesList: Cue[], duckingAmount = 0.28, baseVol = 0.8) => {
    const isSpeaking = cuesList.some(c => now >= (c.start - 0.08) && now <= (c.end + 0.12));
    return isSpeaking ? baseVol * duckingAmount : baseVol;
  };

  // During silence before c1
  assert.equal(isDucking(0.5, cues), 0.8);

  // During speech in c1
  assert.equal(isDucking(2.0, cues), 0.8 * 0.28);

  // During silence between c1 and c2
  assert.equal(isDucking(4.2, cues), 0.8);

  // During speech in c2
  assert.equal(isDucking(6.5, cues), 0.8 * 0.28);

  // After c2
  assert.equal(isDucking(9.0, cues), 0.8);
});
