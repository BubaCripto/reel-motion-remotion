/**
 * Service to extract and cache audio waveform peaks in the browser via Web Audio API.
 */

const peaksCache = new Map<string, Promise<Float32Array | null>>();
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioCtx();
  }
  return sharedAudioContext;
}

/**
 * Extracts normalized audio peaks (0 to 1) for a given audio or video media URL.
 * Downsamples to `samplesPerSecond` (default 50) for fast rendering.
 */
export async function getAudioPeaks(src: string, samplesPerSecond = 50): Promise<Float32Array | null> {
  if (!src) return null;
  if (peaksCache.has(src)) {
    return peaksCache.get(src)!;
  }

  const promise = (async (): Promise<Float32Array | null> => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return null;

      const response = await fetch(src);
      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      // Decode audio data (creates an AudioBuffer)
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const duration = audioBuffer.duration;
      const numPeaks = Math.max(10, Math.floor(duration * samplesPerSecond));
      const peaks = new Float32Array(numPeaks);

      // Read first channel (mono or left)
      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / numPeaks);

      let maxPeak = 0;
      for (let i = 0; i < numPeaks; i++) {
        const start = i * blockSize;
        let sum = 0;
        let count = 0;
        const end = Math.min(start + blockSize, channelData.length);
        for (let j = start; j < end; j += 4) {
          const val = Math.abs(channelData[j]);
          if (val > sum) sum = val;
          count++;
        }
        peaks[i] = sum;
        if (sum > maxPeak) maxPeak = sum;
      }

      // Normalize between 0 and 1
      if (maxPeak > 0) {
        for (let i = 0; i < numPeaks; i++) {
          peaks[i] = Math.min(1, peaks[i] / maxPeak);
        }
      }

      return peaks;
    } catch {
      // Return null silently if file has no audio track or unsupported format
      return null;
    }
  })();

  peaksCache.set(src, promise);
  return promise;
}
