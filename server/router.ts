import type {IncomingMessage,ServerResponse} from 'node:http';
import {answer} from './common';
import {handleMediaInfo,handleUpload} from './api/media';
import {handleRender,handleRenderStatus} from './api/render';
import {handleSilences,handleTranscribe,handleTranscribeWords} from './api/audio';
import {handleAiCaptionReview,handleAiFraming,handleAiImprove,handleAiRhythm,handleAiStyle} from './api/ai';

export async function handleApiRequest(req:IncomingMessage, res:ServerResponse): Promise<boolean> {
  const url = req.url?.split('?')[0] || '';
  if (!url.startsWith('/api/')) return false;

  try {
    if (url === '/api/media-info' && req.method === 'POST') {
      await handleMediaInfo(req, res);
      return true;
    }
    if (url === '/api/upload' && req.method === 'POST') {
      await handleUpload(req, res);
      return true;
    }
    if (url === '/api/render' && req.method === 'POST') {
      await handleRender(req, res);
      return true;
    }
    if (url.startsWith('/api/render/') && req.method === 'GET') {
      const id = url.split('/').pop() || '';
      handleRenderStatus(req, res, id);
      return true;
    }
    if (url === '/api/silences' && req.method === 'POST') {
      await handleSilences(req, res);
      return true;
    }
    if (url === '/api/transcribe-words' && req.method === 'POST') {
      await handleTranscribeWords(req, res);
      return true;
    }
    if (url === '/api/transcribe' && req.method === 'POST') {
      await handleTranscribe(req, res);
      return true;
    }
    if (url === '/api/ai-rhythm' && req.method === 'POST') {
      await handleAiRhythm(req, res);
      return true;
    }
    if (url === '/api/ai-improve' && req.method === 'POST') {
      await handleAiImprove(req, res);
      return true;
    }
    if (url === '/api/ai-framing' && req.method === 'POST') {
      await handleAiFraming(req, res);
      return true;
    }
    if (url === '/api/ai-style' && req.method === 'POST') {
      await handleAiStyle(req, res);
      return true;
    }
    if (url === '/api/ai-caption-review' && req.method === 'POST') {
      await handleAiCaptionReview(req, res);
      return true;
    }

    answer(res, 404, {error: 'Endpoint inexistente'});
    return true;
  } catch (error) {
    answer(res, 500, {error: String(error)});
    return true;
  }
}
