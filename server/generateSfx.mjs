import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../public/sfx');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createWavBuffer(samples, sampleRate = 44100) {
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16-bit

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.round(val), offset);
    offset += 2;
  }

  return buffer;
}

const sampleRate = 44100;

// 1. whoosh-fast.wav
(() => {
  const duration = 0.35;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const env = Math.sin(t * Math.PI) ** 1.8;
    const freq = 300 + Math.sin(t * Math.PI) * 1200;
    const noise = (Math.random() * 2 - 1) * 0.7;
    const tone = Math.sin(2 * Math.PI * freq * (i / sampleRate)) * 0.3;
    samples[i] = (noise + tone) * env * 0.85;
  }
  fs.writeFileSync(path.join(outDir, 'whoosh-fast.wav'), createWavBuffer(samples));
})();

// 2. whoosh-cinematic.wav
(() => {
  const duration = 0.65;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const env = Math.sin(t * Math.PI) ** 2.2;
    const freq = 120 + Math.sin(t * Math.PI) * 600;
    const sub = Math.sin(2 * Math.PI * 60 * (i / sampleRate)) * 0.4;
    const noise = (Math.random() * 2 - 1) * 0.5;
    samples[i] = (noise + sub) * env * 0.9;
  }
  fs.writeFileSync(path.join(outDir, 'whoosh-cinematic.wav'), createWavBuffer(samples));
})();

// 3. impact-boom.wav
(() => {
  const duration = 0.75;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const env = Math.exp(-t * 5.5);
    const freq = 110 * Math.exp(-t * 4) + 28;
    const sine = Math.sin(2 * Math.PI * freq * (i / sampleRate));
    const click = i < 300 ? (Math.random() * 2 - 1) * 0.6 : 0;
    samples[i] = (sine * 0.85 + click) * env;
  }
  fs.writeFileSync(path.join(outDir, 'impact-boom.wav'), createWavBuffer(samples));
})();

// 4. pop-clean.wav
(() => {
  const duration = 0.09;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const env = Math.exp(-t * 22);
    const freq = 900 * Math.exp(-t * 18) + 200;
    samples[i] = Math.sin(2 * Math.PI * freq * (i / sampleRate)) * env * 0.9;
  }
  fs.writeFileSync(path.join(outDir, 'pop-clean.wav'), createWavBuffer(samples));
})();

// 5. camera-click.wav
(() => {
  const duration = 0.14;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let s = 0;
    // Transient 1
    if (t < 0.04) {
      const e1 = Math.exp(-t * 90);
      s += (Math.random() * 2 - 1) * e1 * 0.8 + Math.sin(2 * Math.PI * 2400 * t) * e1 * 0.4;
    }
    // Transient 2 (Mechanical Shutter Close)
    if (t > 0.045 && t < 0.12) {
      const t2 = t - 0.045;
      const e2 = Math.exp(-t2 * 70);
      s += (Math.random() * 2 - 1) * e2 * 0.6 + Math.sin(2 * Math.PI * 1800 * t2) * e2 * 0.3;
    }
    samples[i] = s;
  }
  fs.writeFileSync(path.join(outDir, 'camera-click.wav'), createWavBuffer(samples));
})();

// 6. vinyl-scratch.wav
(() => {
  const duration = 0.28;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const env = Math.sin(t * Math.PI) ** 1.5;
    const modFreq = 400 + Math.sin(t * 28) * 350;
    const sine = Math.sin(2 * Math.PI * modFreq * (i / sampleRate));
    const noise = (Math.random() * 2 - 1) * 0.35;
    samples[i] = (sine * 0.7 + noise) * env * 0.85;
  }
  fs.writeFileSync(path.join(outDir, 'vinyl-scratch.wav'), createWavBuffer(samples));
})();

// 7. coin-ding.wav
(() => {
  const duration = 0.85;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const f1 = 2637; // E7
  const f2 = 3951; // B7
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const env = Math.exp(-t * 5.2);
    const sine = Math.sin(2 * Math.PI * f1 * (i / sampleRate)) * 0.65 +
                 Math.sin(2 * Math.PI * f2 * (i / sampleRate)) * 0.35;
    samples[i] = sine * env * 0.8;
  }
  fs.writeFileSync(path.join(outDir, 'coin-ding.wav'), createWavBuffer(samples));
})();

// 8. riser-speed.wav
(() => {
  const duration = 0.8;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const env = t ** 1.4;
    const freq = 180 * Math.exp(t * 2.2);
    const sine = Math.sin(2 * Math.PI * freq * (i / sampleRate));
    const noise = (Math.random() * 2 - 1) * 0.25 * t;
    samples[i] = (sine * 0.75 + noise) * env * 0.85;
  }
  fs.writeFileSync(path.join(outDir, 'riser-speed.wav'), createWavBuffer(samples));
})();

// 9–18. Original procedural UI effects. Keeping these generated in-repo makes
// the editor and render worker self-contained, with no third-party download or
// licensing dependency.
const write = (name, duration, sample) => {
  const count = Math.floor(sampleRate * duration);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i++) samples[i] = sample(i / sampleRate, i / count, i);
  fs.writeFileSync(path.join(outDir, name), createWavBuffer(samples));
};
const tone = (frequency, time) => Math.sin(2 * Math.PI * frequency * time);

write('cash-register.wav', .52, (t) => {
  const click = t < .025 ? (Math.random() * 2 - 1) * Math.exp(-t * 125) : 0;
  const bellTime = t - .08;
  const bell = bellTime > 0 ? (tone(2350, bellTime) * .58 + tone(3520, bellTime) * .24) * Math.exp(-bellTime * 6) : 0;
  const drawerTime = t - .20;
  const drawer = drawerTime > 0 ? (Math.random() * 2 - 1) * .17 * Math.exp(-drawerTime * 12) : 0;
  return click + bell + drawer;
});
write('sale-cha-ching.wav', .7, (t) => {
  const hit = t < .028 ? (Math.random() * 2 - 1) * Math.exp(-t * 95) * .55 : 0;
  const a = tone(1318.5, t) * Math.exp(-t * 6.5);
  const late = t - .09;
  const b = late > 0 ? tone(1975.5, late) * Math.exp(-late * 5) : 0;
  return hit + (a + b) * .52;
});
write('profit-up.wav', .76, (t, n) => {
  const frequency = 290 * Math.exp(n * 1.85);
  return (tone(frequency, t) * .58 + tone(frequency * 2, t) * .16) * Math.sin(n * Math.PI) ** .72;
});
write('cash-counting.wav', .64, (t) => {
  const pulse = (t * 12) % 1;
  return pulse < .17 ? ((Math.random() * 2 - 1) * .28 + tone(1300, t) * .35) * Math.exp(-pulse * 24) : 0;
});
write('coin-rain.wav', .92, (t) => {
  let sound = 0;
  for (const start of [.03, .15, .26, .39, .53, .66]) {
    const local = t - start;
    if (local >= 0) sound += (tone(2190, local) * .28 + tone(3290, local) * .12) * Math.exp(-local * 14);
  }
  return sound;
});
write('bell-notification.wav', 1.1, (t) => (tone(1318.5, t) * .6 + tone(1975.5, t) * .35) * Math.exp(-t * 4.5));
write('glitch-digital.wav', .32, (t, n) => {
  const gate = Math.floor(n * 19) % 2 ? 1 : .13;
  return ((Math.random() * 2 - 1) * .48 + tone(220 + n * 980, t) * .38) * Math.exp(-n * 2.8) * gate;
});
write('popup-bubble.wav', .18, (t) => tone(920 * Math.exp(-t * 16) + 190, t) * Math.exp(-t * 22) * .9);
write('error-buzzer.wav', .42, (t) => tone(170 + (Math.floor(t * 9) % 2) * 35, t) * Math.exp(-t * 3.3) * .8);
write('counter-tick.wav', .075, (t) => (tone(1750, t) * .8 + tone(2600, t) * .18) * Math.exp(-t * 42));
write('counter-finish.wav', .72, (t) => {
  const first = tone(1046.5, t) * Math.exp(-t * 8);
  const secondTime = t - .12;
  const second = secondTime > 0 ? tone(1568, secondTime) * Math.exp(-secondTime * 6) : 0;
  return (first + second) * .65;
});
write('success-chime.wav', .95, (t) => {
  const a = tone(783.99, t) * Math.exp(-t * 5);
  const later = t - .14;
  const b = later > 0 ? tone(1174.66, later) * Math.exp(-later * 4.4) : 0;
  return (a + b) * .58;
});
write('ui-click.wav', .09, (t) => ((Math.random() * 2 - 1) * .22 + tone(1900, t) * .7) * Math.exp(-t * 39));
write('transition-swipe.wav', .38, (t, n) => ((Math.random() * 2 - 1) * .48 + tone(220 + n * 1180, t) * .2) * Math.sin(n * Math.PI) ** 1.3 * .75);

console.log('SFX generation complete in ' + outDir);
