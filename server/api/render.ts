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

  const child = run(exe, ['render', 'src/remotion/index.ts', 'ReelTypography', out, '--props', file, '--codec', 'h264'], base, (code, msg) => {
    if (job.state !== 'running') return;
    job.state = code === 0 ? 'done' : 'error';
    job.progress = code === 0 ? 100 : undefined;
    job.message = code === 0 ? 'MP4 pronto' : ('Falha na renderização: ' + msg.slice(-850));
    if (code === 0) job.url = '/renders/' + id + '.mp4';
  }, (chunk) => {
    const pctMatch = chunk.match(/([0-9]{1,3})%/);
    if (pctMatch) {
      job.progress = Math.min(99, Math.max(1, Number(pctMatch[1])));
      job.message = `Renderizando MP4: ${job.progress}%`;
    }
  });

  job.process = child;

  return answer(res, 200, {id, fps: p.fps});
}

export function handleRenderStatus(req:IncomingMessage, res:ServerResponse, id:string): void {
  const j = jobs.get(id);
  return answer(res, j ? 200 : 404, j ?? {error: 'Job inexistente'});
}

export function handleRenderCancel(req:IncomingMessage, res:ServerResponse, id:string): void {
  const j = jobs.get(id);
  if (!j) return answer(res, 404, {error: 'Job inexistente'});
  if (j.state !== 'running') return answer(res, 200, {message: 'Render não está em execução', state: j.state});

  if (j.process) {
    try {
      if (process.platform === 'win32') {
        import('node:child_process').then(({exec}) => {
          if (j.process?.pid) {
            exec(`taskkill /pid ${j.process.pid} /T /F`, () => {});
          }
        });
      } else {
        j.process.kill('SIGKILL');
      }
    } catch {}
  }

  j.state = 'cancelled';
  j.message = 'Renderização cancelada';
  j.progress = undefined;
  return answer(res, 200, {success: true, message: 'Cancelado com sucesso'});
}

export function handleStorageInfo(req:IncomingMessage, res:ServerResponse): void {
  try {
    const renders = fs.existsSync(renderDir) ? fs.readdirSync(renderDir).map(file => {
      try {
        const full = path.join(renderDir, file);
        const stat = fs.statSync(full);
        return {name: file, size: stat.size, mtime: stat.mtimeMs};
      } catch {
        return {name: file, size: 0, mtime: 0};
      }
    }) : [];

    const totalRenderBytes = renders.reduce((acc, f) => acc + f.size, 0);
    return answer(res, 200, {
      renderCount: renders.length,
      renderBytes: totalRenderBytes,
      renderMb: Number((totalRenderBytes / (1024 * 1024)).toFixed(2))
    });
  } catch (e) {
    return answer(res, 500, {error: String(e)});
  }
}

export function handleStorageCleanup(req:IncomingMessage, res:ServerResponse): void {
  try {
    let freedBytes = 0;
    let deletedFiles = 0;
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (fs.existsSync(renderDir)) {
      const renders = fs.readdirSync(renderDir);
      for (const f of renders) {
        const full = path.join(renderDir, f);
        try {
          const stat = fs.statSync(full);
          const isJson = f.endsWith('.json');
          const shouldDelete = isJson ? (now - stat.mtimeMs > 12 * 60 * 60 * 1000) : (now - stat.mtimeMs > maxAge);
          if (shouldDelete) {
            freedBytes += stat.size;
            fs.unlinkSync(full);
            deletedFiles++;
          }
        } catch {}
      }
    }

    return answer(res, 200, {
      success: true,
      deletedFiles,
      freedBytes,
      freedMb: Number((freedBytes / (1024 * 1024)).toFixed(2))
    });
  } catch (e) {
    return answer(res, 500, {error: String(e)});
  }
}

