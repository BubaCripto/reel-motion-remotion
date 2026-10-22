import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {answer,base,collect,mediaDir,run} from '../common';
import {inspectVideo} from '../media-info.mjs';

export async function handleMediaInfo(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 128 * 1024)).toString());
  if (!Array.isArray(body.sources) || body.sources.length > 32 || body.sources.some((s:unknown) => typeof s !== 'string')) {
    return answer(res, 400, {error: 'Informe até 32 arquivos de vídeo.'});
  }
  const sources = [...new Set(body.sources)] as string[];
  const infos: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (let i = 0; i < sources.length; i += 4) {
    await Promise.all(sources.slice(i, i + 4).map(async src => {
      try {
        infos[src] = await inspectVideo(src, base);
      } catch (error) {
        errors[src] = error instanceof Error ? error.message : String(error);
      }
    }));
  }
  return answer(res, 200, {infos, errors});
}

export async function handleUpload(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const ext = String(req.headers['x-file-extension'] || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const allowed = ['mp4','mov','webm','m4v','mp3','wav','m4a','ogg','png','jpg','jpeg','webp','svg','woff','woff2','ttf','otf'];
  if (!allowed.includes(ext)) {
    return answer(res, 400, {error: 'Tipo de arquivo não permitido'});
  }
  const size = ext.match(/^(mp4|mov|webm|m4v)$/) ? 1024 * 1024 * 1000 : 1024 * 1024 * 80;
  const id = crypto.randomUUID();
  const fname = id + '.' + ext;
  const data = await collect(req, size);
  const source = path.join(mediaDir, fname);
  fs.writeFileSync(source, data);

  if (ext.match(/^(mp4|mov|webm|m4v)$/)) {
    const previewName = id + '-preview.mp4';
    const preview = path.join(mediaDir, previewName);
    const ffmpeg = process.env.REEL_FFMPEG || 'ffmpeg';
    const result = await new Promise<{code:number;message:string}>(resolve =>
      run(
        ffmpeg,
        ['-y','-i',source,'-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','veryfast','-crf','20','-g','30','-keyint_min','30','-sc_threshold','0','-pix_fmt','yuv420p','-movflags','+faststart','-c:a','aac','-b:a','160k',preview],
        base,
        (code, message) => resolve({code, message})
      )
    );
    if (result.code === 0 && fs.existsSync(preview)) {
      return answer(res, 200, {src: '/media/' + previewName, original: '/media/' + fname, bytes: data.length, optimized: true});
    }
    return answer(res, 200, {src: '/media/' + fname, bytes: data.length, optimized: false, warning: 'FFmpeg não conseguiu otimizar o preview: ' + result.message.slice(-240)});
  }

  return answer(res, 200, {src: '/media/' + fname, bytes: data.length});
}
