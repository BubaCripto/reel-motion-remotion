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

console.log('SFX generation complete in ' + outDir);
