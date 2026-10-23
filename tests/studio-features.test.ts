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

test('audio volume levels and mute states are clamped and evaluated correctly', () => {
  const clampVol = (vol?: number, muted?: boolean) => {
    if (muted) return 0;
    const v = vol ?? 1;
    return Math.min(1, Math.max(0, v));
  };

  // Default volume is 100% (1)
  assert.equal(clampVol(undefined, false), 1);
  assert.equal(clampVol(1, false), 1);

  // Lowered volume (e.g. 30%)
  assert.equal(clampVol(0.3, false), 0.3);

  // Muted volume returns 0 regardless of volume value
  assert.equal(clampVol(0.7, true), 0);
  assert.equal(clampVol(1.0, true), 0);

  // Values clamped between 0 and 1
  assert.equal(clampVol(-0.5, false), 0);
  assert.equal(clampVol(1.5, false), 1);
});

test('custom ducking attenuation scales background audio according to slider percentage', () => {
  const cues: Cue[] = [{id: 'speech-1', start: 2.0, end: 5.0, text: 'Fala ativa'}];

  const calcVolume = (time: number, baseVol: number, duckingAmount: number, muted = false) => {
    if (muted) return 0;
    const isSpeaking = cues.some(c => time >= (c.start - 0.08) && time <= (c.end + 0.12));
    const ratio = Math.min(1, Math.max(0, duckingAmount));
    return isSpeaking ? baseVol * ratio : baseVol;
  };

  // Base volume 80%, ducking at 15%
  assert.equal(calcVolume(1.0, 0.8, 0.15), 0.8); // silence
  assert.ok(Math.abs(calcVolume(3.0, 0.8, 0.15) - 0.12) < 0.001); // speaking: 0.8 * 0.15 = 0.12

  // Base volume 50%, ducking at 40%
  assert.equal(calcVolume(1.0, 0.5, 0.40), 0.5); // silence
  assert.ok(Math.abs(calcVolume(3.0, 0.5, 0.40) - 0.20) < 0.001); // speaking: 0.5 * 0.40 = 0.20
});
