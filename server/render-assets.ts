import fs from 'node:fs';
import path from 'node:path';

const importedMedia = /^\/media\/([a-z0-9-]+\.[a-z0-9]+)$/i;
const bundledSfx = /^\/sfx\/([a-z0-9-]+\.(?:wav|mp3))$/i;
const allowedDemoAudio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==';

/** Only allow assets the render worker can resolve from public/. No paths or remote URLs reach Remotion. */
export function isRenderableAsset(src: unknown, root = process.cwd()): boolean {
  if (src === '/demo-grid.svg' || src === allowedDemoAudio) return true;
  if (typeof src !== 'string') return false;
  const media = src.match(importedMedia);
  if (media) return fs.existsSync(path.join(root, 'public', 'media', media[1]));
  const sfx = src.match(bundledSfx);
  if (sfx) return fs.existsSync(path.join(root, 'public', 'sfx', sfx[1]));
  return false;
}
