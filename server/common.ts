import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import type {IncomingMessage,ServerResponse} from 'node:http';

export const base = process.cwd();
export const mediaDir = path.join(base,'public','media');
export const renderDir = path.join(base,'public','renders');

fs.mkdirSync(mediaDir,{recursive:true});
fs.mkdirSync(renderDir,{recursive:true});

export type Job = {
  state: 'running'|'done'|'error';
  message: string;
  url?: string;
  silences?: {start:number;end:number}[];
};

export const jobs = new Map<string,Job>();

export const answer = (res:ServerResponse, status:number, value:unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(value));
};

export const collect = async (req:IncomingMessage, limit:number): Promise<Buffer> => {
  let size = 0;
  const buffers:Buffer[] = [];
  for await (const b of req) {
    size += b.length;
    if (size > limit) throw Error('Limite de tamanho excedido');
    buffers.push(b);
  }
  return Buffer.concat(buffers);
};

export const run = (bin:string, args:string[], cwd:string, onExit:(code:number,msg:string)=>void) => {
  const child = spawn(bin, args, {cwd, shell:process.platform==='win32', windowsHide:true});
  let buffer = '';
  child.stdout?.on('data', c => buffer = (buffer + c.toString()).slice(-10000));
  child.stderr?.on('data', c => buffer = (buffer + c.toString()).slice(-10000));
  child.on('error', e => onExit(-1, e.message));
  child.on('close', code => onExit(code ?? 1, buffer));
  return child;
};
