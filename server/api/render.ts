import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {answer,base,collect,jobs,renderDir,run,type Job} from '../common';
import {prepareRenderFrameRate} from '../media-info.mjs';

export async function handleRender(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 8 * 1024 * 1024)).toString());
  let p = body.project;
  if (!p || !Array.isArray(p.cues) || !Array.isArray(p.overlays) || !Array.isArray(p.clips)) {
    return answer(res, 400, {error: 'Projeto incompleto'});
  }
  const refs = [p.videoSrc, ...p.clips.map((c:any) => c.src), ...p.overlays.map((o:any) => o.src), ...p.fonts.map((f:any) => f.src)].filter(Boolean);
  const allowedDemoAudio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==';
  if (refs.some((s:any) => typeof s !== 'string' || (!/^\/media\/[a-z0-9-]+\.[a-z0-9]+$/i.test(s) && s !== '/demo-grid.svg' && s !== allowedDemoAudio))) {
    return answer(res, 400, {error: 'Importe todos os arquivos de mídia pelo editor antes de renderizar'});
  }
  try {
    p = await prepareRenderFrameRate(p, base);
  } catch (error) {
    return answer(res, 400, {error: error instanceof Error ? error.message : String(error)});
  }
  const id = crypto.randomUUID();
  const file = path.join(renderDir, id + '.json');
  const out = path.join(renderDir, id + '.mp4');
  fs.writeFileSync(file, JSON.stringify({project: p}));

  const job: Job = {state: 'running', message: `Renderização Remotion · ${Number(p.fps.toFixed(3))} fps`};
  jobs.set(id, job);

  const exe = process.platform === 'win32'
    ? path.join(base, 'node_modules', '.bin', 'remotion.cmd')
    : path.join(base, 'node_modules', '.bin', 'remotion');

  run(exe, ['render', 'src/remotion/index.ts', 'ReelTypography', out, '--props', file, '--codec', 'h264'], base, (code, msg) => {
    if (job.state !== 'running') return;
    job.state = code === 0 ? 'done' : 'error';
    job.message = code === 0 ? 'MP4 pronto' : ('Falha na renderização: ' + msg.slice(-850));
    if (code === 0) job.url = '/renders/' + id + '.mp4';
  });

  return answer(res, 200, {id, fps: p.fps});
}

export function handleRenderStatus(req:IncomingMessage, res:ServerResponse, id:string): void {
  const j = jobs.get(id);
  return answer(res, j ? 200 : 404, j ?? {error: 'Job inexistente'});
}
