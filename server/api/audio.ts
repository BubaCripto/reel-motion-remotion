import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {answer,base,collect,jobs,renderDir,run,type Job} from '../common';

export async function handleSilences(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 1024 * 1024)).toString());
  if (!/^\/media\/[a-z0-9-]+\.(mp4|mov|webm|m4v|mp3|wav|m4a)$/i.test(body.src || '')) {
    return answer(res, 400, {error: 'Importe o vídeo antes'});
  }
  const fname = path.join(base, 'public', String(body.src).slice(1));
  const id = crypto.randomUUID();
  const job: Job = {state: 'running', message: 'FFmpeg analisando silêncio'};
  jobs.set(id, job);

  const exe = process.env.REEL_FFMPEG || 'ffmpeg';
  const threshold = Number.isFinite(body.threshold) ? Math.min(-20, Math.max(-55, body.threshold)) : -35;

  run(exe, ['-hide_banner', '-i', fname, '-af', `silencedetect=noise=${threshold}dB:d=0.38`, '-f', 'null', '-'], base, (_code, msg) => {
    if (job.state !== 'running') return;
    const starts = [...msg.matchAll(/silence_start:\s*([0-9.]+)/g)].map(m => Number(m[1]));
    const ends = [...msg.matchAll(/silence_end:\s*([0-9.]+)/g)].map(m => Number(m[1]));
    const silences = starts.map((start, i) => ({start, end: ends[i] ?? Number(body.duration || 0)})).filter(x => x.end > x.start);
    job.state = 'done';
    job.message = 'Análise finalizada';
    job.silences = silences;
  });

  return answer(res, 200, {id});
}

export async function handleTranscribeWords(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 1024 * 1024)).toString());
  if (!/^\/media\/[a-z0-9-]+\.(mp4|mov|webm|m4v|mp3|wav|m4a)$/i.test(body.src || '')) {
    return answer(res, 400, {error: 'Importe um vídeo ou áudio primeiro'});
  }
  const id = crypto.randomUUID();
  const out = path.join(renderDir, id + '.json');
  const job: Job = {state: 'running', message: 'faster-whisper sincronizando palavras'};
  jobs.set(id, job);

  const filename = path.join(base, 'public', String(body.src).slice(1));
  const python = process.env.REEL_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

  run(python, ['scripts/transcribe_words.py', filename, String(body.model || 'small'), out], base, (code, msg) => {
    if (job.state !== 'running') return;
    job.state = code === 0 && fs.existsSync(out) ? 'done' : 'error';
    job.progress = code === 0 ? 100 : undefined;
    job.message = job.state === 'done' ? 'Palavras sincronizadas' : 'faster-whisper não está pronto: ' + msg.slice(-600);
    if (job.state === 'done') job.url = '/renders/' + id + '.json';
  }, (chunk) => {
    const pctMatch = chunk.match(/([0-9]{1,3})%/);
    if (pctMatch) {
      job.progress = Math.min(99, Math.max(1, Number(pctMatch[1])));
      job.message = `Sincronizando palavras: ${job.progress}%`;
    }
  });

  return answer(res, 200, {id});
}

export async function handleTranscribe(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 1024 * 1024)).toString());
  if (!/^\/media\/[a-z0-9-]+\.(mp4|mov|webm|m4v|mp3|wav|m4a)$/i.test(body.src || '')) {
    return answer(res, 400, {error: 'Importe um vídeo ou áudio primeiro'});
  }
  const id = crypto.randomUUID();
  const output = path.join(os.tmpdir(), 'reel-transcribe-' + id);
  fs.mkdirSync(output, {recursive: true});

  const job: Job = {state: 'running', message: 'Whisper está transcrevendo o arquivo', progress: 5};
  jobs.set(id, job);

  const filename = path.join(base, 'public', String(body.src).slice(1));
  const python = process.env.REEL_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

  run(python, ['-m', 'whisper', filename, '--language', body.language || 'Portuguese', '--model', body.model || 'small', '--output_format', 'srt', '--output_dir', output], base, (code, msg) => {
    if (job.state !== 'running') return;
    if (code !== 0) {
      job.state = 'error';
      job.message = 'Whisper indisponível ou falhou: ' + msg.slice(-550);
      return;
    }
    const srt = fs.readdirSync(output).find(x => x.endsWith('.srt'));
    if (!srt) {
      job.state = 'error';
      job.message = 'Whisper não gerou um arquivo SRT';
      return;
    }
    const out = '/renders/' + id + '.srt';
    fs.copyFileSync(path.join(output, srt), path.join(renderDir, id + '.srt'));
    job.state = 'done';
    job.progress = 100;
    job.message = 'Transcrição pronta';
    job.url = out;
  }, (chunk) => {
    const pctMatch = chunk.match(/([0-9]{1,3})%/);
    if (pctMatch) {
      job.progress = Math.min(99, Math.max(1, Number(pctMatch[1])));
      job.message = `Whisper transcrevendo: ${job.progress}%`;
    }
  });

  return answer(res, 200, {id});
}
