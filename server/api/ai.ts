import type {IncomingMessage,ServerResponse} from 'node:http';
import {answer,base,collect} from '../common';
import {analyzeRhythm} from '../rhythm';
import {validateProject} from '../../src/lib/project';
import {generateSemanticMotionBlueprint} from '../../src/lib/motionCompiler';

export async function handleAiRhythm(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 2 * 1024 * 1024)).toString());
  let project;
  try {
    project = validateProject(body.project);
  } catch (error) {
    return answer(res, 400, {error: String(error)});
  }
  const objective = typeof body.objective === 'string' ? body.objective.trim().slice(0, 1500) : '';
  if (!objective) {
    return answer(res, 400, {error: 'Informe o objetivo do Reel para orientar a análise e o CTA.'});
  }
  if (!project.clips.length || !project.cues.some(c => c.source === 'transcript')) {
    return answer(res, 400, {error: 'Importe o vídeo e gere ou importe as legendas da fala antes de analisar.'});
  }
  try {
    return answer(res, 200, {analysis: await analyzeRhythm(project, objective, String(body.model || ''), base)});
  } catch (error) {
    return answer(res, 503, {error: String(error)});
  }
}

export async function handleAiImprove(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 512 * 1024)).toString());
  const cues = Array.isArray(body.cues) ? body.cues : [];
  if (!cues.length) {
    return answer(res, 400, {error: 'Transcreva ou importe legendas antes de pedir melhorias à IA.'});
  }
  const bridgeUrl = (process.env.REEL_AG_BRIDGE_URL || 'http://127.0.0.1:11435/v1').replace(/\/$/, '');
  const model = String(process.env.REEL_AG_MODEL || body.model || 'antigravity-claude-sonnet-4-6');
  const prompt = String(body.prompt || '').slice(0, 4000);
  const transcript = cues.map((c:any) => ({id: String(c.id), start: Number(c.start), end: Number(c.end), text: String(c.text || '')}));

  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 60000);
    const r = await fetch(bridgeUrl + '/chat/completions', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'authorization': 'Bearer local'},
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        temperature: 0.15,
        response_format: {type: 'json_object'},
        messages: [
          {
            role: 'system',
            content: 'Você é um editor de vídeo criterioso. Analise uma transcrição temporizada em português. Retorne SOMENTE JSON válido no formato {"cuts":[{"start":number,"end":number,"reason":string}],"rewrites":[{"id":string,"text":string}],"summary":string}. cuts remove vícios de linguagem, frases interrompidas/erradas e pausas sem conteúdo. Nunca corte fala útil; cada corte deve ter duração entre 0.08 e 12 segundos e respeitar o tempo informado. rewrites corrigem apenas ortografia/pontuação de uma legenda, mantendo seu sentido. Não invente ids.'
          },
          {
            role: 'user',
            content: `Instrução editorial do usuário: ${prompt || 'Remova pausas, erros e frases incompletas, preservando a mensagem principal.'}\n\nTranscrição: ${JSON.stringify(transcript)}`
          }
        ],
        stream: false
      })
    });
    clearTimeout(timeout);
    if (!r.ok) throw Error('Bridge respondeu HTTP ' + r.status);
    const data = await r.json() as any;
    const raw = String(data?.choices?.[0]?.message?.content || '').replace(/^```json\s*|\s*```$/g, '');
    const value = JSON.parse(raw);
    const ids = new Set(transcript.map((c:any) => c.id));
    const cuts = (Array.isArray(value.cuts) ? value.cuts : [])
      .map((c:any) => ({start: Number(c.start), end: Number(c.end), reason: String(c.reason || 'Trecho removido')}))
      .filter((c:any) => Number.isFinite(c.start) && Number.isFinite(c.end) && c.end > c.start && c.end - c.start <= 12);
    const rewrites = (Array.isArray(value.rewrites) ? value.rewrites : [])
      .map((x:any) => ({id: String(x.id), text: String(x.text || '').trim()}))
      .filter((x:any) => ids.has(x.id) && x.text);
    return answer(res, 200, {provider: 'ag-local-bridge', model, cuts, rewrites, summary: String(value.summary || 'Análise concluída.')});
  } catch (e) {
    return answer(res, 503, {error: 'AG Local Bridge indisponível. Instale/inicie a extensão no Antigravity e confirme http://localhost:11435/v1/models. Detalhe: ' + String(e)});
  }
}

export async function handleAiFraming(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 256 * 1024)).toString());
  const cues = Array.isArray(body.cues) ? body.cues : [];
  const start = Math.max(0, Number(body.start) || 0), end = Math.max(start + .1, Number(body.end) || 0);
  try {
    const bridgeUrl = (process.env.REEL_AG_BRIDGE_URL || 'http://127.0.0.1:11435/v1').replace(/\/$/, '');
    const model = String(process.env.REEL_AG_GEMINI_MODEL || body.model || 'antigravity-gemini-3.8-flash-medium');
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(bridgeUrl + '/chat/completions', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'authorization': 'Bearer local'},
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        temperature: .25,
        response_format: {type: 'json_object'},
        messages: [
          {
            role: 'system',
            content: 'Você é diretor de edição para Reels verticais. Crie enquadramentos discretos guiados pela ênfase semântica das legendas. Retorne SOMENTE JSON: {"keyframes":[{"time":number,"x":number,"y":number,"scale":number,"reason":string}]}. Produza no máximo 12 pontos. x/y são de 0 a 100, scale de 1 a 1.22. Não corte rosto deliberadamente e evite movimento excessivo.'
          },
          {
            role: 'user',
            content: `Trecho de ${start}s a ${end}s. Legendas: ${JSON.stringify(cues.filter((c:any) => Number(c.end) > start && Number(c.start) < end).map((c:any) => ({start: c.start, end: c.end, text: c.text})))}`
          }
        ],
        stream: false
      })
    });
    clearTimeout(timeout);
    if (!r.ok) throw Error('Bridge respondeu HTTP ' + r.status);
    const data = await r.json() as any;
    const raw = String(data?.choices?.[0]?.message?.content || '').replace(/^```json\s*|\s*```$/g, '');
    const value = JSON.parse(raw);
    const keyframes = (Array.isArray(value.keyframes) ? value.keyframes : [])
      .map((k:any) => ({time: Number(k.time), x: Number(k.x), y: Number(k.y), scale: Number(k.scale), reason: String(k.reason || '')}))
      .filter((k:any) => Number.isFinite(k.time) && k.time >= start && k.time <= end && Number.isFinite(k.x) && Number.isFinite(k.y) && Number.isFinite(k.scale))
      .slice(0, 12);
    return answer(res, 200, {provider: 'ag-local-bridge', model, keyframes});
  } catch (e) {
    return answer(res, 503, {error: 'Gemini via AG Local Bridge indisponível. Detalhe: ' + String(e)});
  }
}

export async function handleAiStyle(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 256 * 1024)).toString());
  try {
    const bridgeUrl = (process.env.REEL_AG_BRIDGE_URL || 'http://127.0.0.1:11435/v1').replace(/\/$/, '');
    const model = String(process.env.REEL_AG_GEMINI_MODEL || body.model || 'antigravity-gemini-3.8-flash-medium');
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(bridgeUrl + '/chat/completions', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'authorization': 'Bearer local'},
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        temperature: .35,
        response_format: {type: 'json_object'},
        messages: [
          {
            role: 'system',
            content: 'Você é diretor de motion typography. Escolha para cada legenda exatamente um estilo da lista: impact,kinetic,editorial,collage,word-by-word,slide-up,slide-side,stacked,marker,magazine,sticker,typewriter,neon-box,scribble-highlight,handwritten-mix,elegant-layered,pop,elastic,blur-reveal,mask-wipe,flip,zoom-in,zoom-out,glitch,shake,bounce,wave,cascade,fade,tracking,rubber,rotate-in,drop,punch,split,highlight-swipe,scale-out,slide-down,roll,float. Responda SOMENTE JSON no formato {"presets":["impact",...]}. Não altere palavras.'
          },
          {
            role: 'user',
            content: `Gere exatamente ${body.cues?.length || 0} presets para: ${JSON.stringify((body.cues || []).map((c:any) => c.text)).slice(0, 12000)}`
          }
        ],
        stream: false
      })
    });
    clearTimeout(timeout);
    if (!r.ok) throw Error('Bridge respondeu HTTP ' + r.status);
    const data = await r.json() as any;
    const raw = String(data?.choices?.[0]?.message?.content || '').replace(/^```json\s*|\s*```$/g, '');
    return answer(res, 200, {provider: 'ag-local-bridge', model, ...JSON.parse(raw)});
  } catch (e) {
    return answer(res, 503, {error: 'Gemini via AG Local Bridge indisponível. Confirme que a bridge está ativa em localhost:11435. Detalhe: ' + String(e)});
  }
}

export async function handleAiCaptionReview(req:IncomingMessage, res:ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 512 * 1024)).toString());
  const sourceCues = Array.isArray(body.cues) ? body.cues : [];
  if (!sourceCues.length) {
    return answer(res, 400, {error: 'Não há legendas para revisar.'});
  }
  const bridgeUrl = (process.env.REEL_AG_BRIDGE_URL || 'http://127.0.0.1:11435/v1').replace(/\/$/, '');
  const model = String(process.env.REEL_AG_GEMINI_MODEL || body.model || 'antigravity-gemini-3.8-flash-medium');
  const cues = sourceCues.map((c:any) => ({id: String(c.id), start: Number(c.start), end: Number(c.end), text: String(c.text || '')}));
  const ids = new Set(cues.map((c:any) => c.id));
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 60000);
    const r = await fetch(bridgeUrl + '/chat/completions', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'authorization': 'Bearer local'},
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        temperature: .05,
        response_format: {type: 'json_object'},
        messages: [
          {
            role: 'system',
            content: 'Você revisa legendas do Whisper em português brasileiro para um editor de Reels. Corrija palavras claramente transcritas errado, pontuação, concordância e quebras de frase usando o contexto temporal. Não invente fatos nem altere id, início ou fim. Em cada texto, marque entre [colchetes] uma a três palavras-chave faladas que merecem destaque visual. Retorne SOMENTE JSON {"cues":[{"id":"id original","text":"texto revisado com [destaques]"}]}, com exatamente um item por id.'
          },
          {
            role: 'user',
            content: `Arquivo transcrito: ${String(body.src || '').slice(0, 180)}. Legendas com tempos: ${JSON.stringify(cues)}`
          }
        ],
        stream: false
      })
    });
    clearTimeout(timeout);
    if (!r.ok) throw Error('Bridge respondeu HTTP ' + r.status);
    const data = await r.json() as any;
    const raw = String(data?.choices?.[0]?.message?.content || '').replace(/^```json\s*|\s*```$/g, '');
    const value = JSON.parse(raw);
    const revised = new Map((Array.isArray(value.cues) ? value.cues : []).map((c:any) => [String(c.id), String(c.text || '').trim()]));
    const originalById = new Map(sourceCues.map((c:any) => [String(c.id), c]));
    const output = cues.map((c:any) => ({...(originalById.get(c.id) || {}), text: revised.has(c.id) && revised.get(c.id) ? revised.get(c.id) : c.text})).filter((c:any) => ids.has(c.id));
    return answer(res, 200, {provider: 'ag-local-bridge', model, cues: output});
  } catch (e) {
    return answer(res, 503, {error: 'Gemini via AG Local Bridge não revisou as legendas. Detalhe: ' + String(e)});
  }
}

export async function handleAiDirector(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = JSON.parse((await collect(req, 1024 * 1024)).toString());
  const cues = Array.isArray(body.cues) ? body.cues : [];
  if (!cues.length) {
    return answer(res, 400, { error: 'Gere ou importe legendas antes de solicitar a Direção de Motion Graphics.' });
  }

  const style = (body.style || 'viral-after-effects') as any;
  const intensity = (body.intensity || 'balanced') as any;
  const videoDuration = Math.max(1, Number(body.videoDuration) || 15);
  const bridgeUrl = (process.env.REEL_AG_BRIDGE_URL || 'http://127.0.0.1:11435/v1').replace(/\/$/, '');
  const model = String(process.env.REEL_AG_MODEL || body.model || 'antigravity-claude-sonnet-4-6');

  // Attempt AG Local Bridge first
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 45000);
    const r = await fetch(bridgeUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': 'Bearer local' },
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Você é um Diretor de Motion Design Sênior especializado em Reels de alto impacto viral (estilo After Effects, Vox, Ordinary Folk).
PROIBIDO USAR CARDS ESTÁTICOS DE UI.
Gere uma coreografia de motion graphics frase por frase sincronizada aos timestamps.
Retorne SOMENTE JSON rigoroso no formato:
{
  "directorVision": string,
  "cameraPunches": [{"time": number, "scale": number, "transition": "flash"|"whip-right"|"zoom-in"|"crossfade", "reason": string}],
  "motionLayers": [
    {
      "id": string,
      "type": "kinetic-text"|"stroke-path"|"burst"|"scene"|"speed-lines"|"camera-shake",
      "name": string,
      "start": number,
      "end": number,
      "x": number,
      "y": number,
      "scale": number,
      "color": string,
      "text": string,
      "motionProps": {
        "style"?: "3d-tilt"|"elastic-bounce"|"stagger-drop",
        "shape"?: "curved-arrow"|"scribble-circle"|"marker-underline"|"target-reticle",
        "scene"?: "growth-graph"|"target-lock"|"rocket-launch"|"stamp-impact"|"hazard-warning"|"hourglass"|"speed-gauge"|"neural-brain",
        "label"?: string,
        "metric"?: string,
        "accent"?: string
      },
      "sfx": "whoosh-fast"|"impact-boom"|"pop-clean"|"camera-click"|"vinyl-scratch"|"coin-ding"|"riser-speed"
    }
  ],
  "soundDesign": [{"time": number, "sfx": string, "volume": number}]
}
Mantenha os grafismos no topo (y: 25% a 45%) para nunca cobrir legendas ou o rosto do orador.`
          },
          {
            role: 'user',
            content: `Estilo: ${style}, Intensidade: ${intensity}, Duração do vídeo: ${videoDuration}s.\nLegendas: ${JSON.stringify(cues.map((c: any) => ({ start: c.start, end: c.end, text: c.text })))}`
          }
        ],
        stream: false
      })
    });
    clearTimeout(timeout);
    if (r.ok) {
      const data = await r.json() as any;
      const raw = String(data?.choices?.[0]?.message?.content || '').replace(/^```json\s*|\s*```$/g, '');
      const value = JSON.parse(raw);
      if (Array.isArray(value.motionLayers)) {
        return answer(res, 200, {
          provider: 'ag-local-bridge',
          model,
          blueprint: {
            ...value,
            style,
            intensity
          }
        });
      }
    }
  } catch (err) {
    // Graceful fallback to deterministic semantic generator below
  }

  // Fallback: Intelligent Deterministic Semantic Engine
  const blueprint = generateSemanticMotionBlueprint(cues, style, intensity, videoDuration);
  return answer(res, 200, {
    provider: 'semantic-motion-engine',
    model: 'built-in-semantic-director',
    blueprint
  });
}

