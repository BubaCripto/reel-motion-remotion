import React from 'react';

type Props = {
  agModel: string;
  onSetAgModel: (m: string) => void;
  aiPrompt: string;
  onSetAiPrompt: (p: string) => void;
  aiSummary: string;
  renderJob: string;
  hasCues: boolean;
  model: string;
  onSetModel: (m: string) => void;
  onImproveWithAi: () => void;
  onTranscribe: () => void;
  onTranscribeWords: () => void;
  onSuggestStyles: () => void;
  onSmartStyle: () => void;
  onSuggestGeminiFraming: () => void;
  onFaceReframe: () => void;
  onAutoZoom: () => void;
  onCutSilences: () => void;
};

export const AiPanel: React.FC<Props> = ({
  agModel,
  onSetAgModel,
  aiPrompt,
  onSetAiPrompt,
  aiSummary,
  renderJob,
  hasCues,
  model,
  onSetModel,
  onImproveWithAi,
  onTranscribe,
  onTranscribeWords,
  onSuggestStyles,
  onSmartStyle,
  onSuggestGeminiFraming,
  onFaceReframe,
  onAutoZoom,
  onCutSilences
}) => {
  return (
    <div className="fields">
      <h3>FERRAMENTAS INTELIGENTES</h3>
      <div className="sectionLine">AG LOCAL BRIDGE · GEMINI</div>
      <p>Usa Gemini via Antigravity para revisar a transcrição, aplicar cortes e sugerir a direção criativa.</p>
      <label>
        Modelo Gemini
        <input
          value={agModel}
          onChange={e => onSetAgModel(e.target.value)}
          placeholder="antigravity-gemini-3.8-flash-medium"
        />
      </label>
      <label>
        Prompt de melhoria
        <textarea
          rows={5}
          value={aiPrompt}
          onChange={e => onSetAiPrompt(e.target.value)}
          placeholder="Ex.: deixe o vídeo mais direto, remova repetições e mantenha um tom profissional."
        />
      </label>
      <button className="accentBtn" onClick={onImproveWithAi} disabled={!!renderJob || !hasCues}>
        ✦ Melhorar edição e aplicar cortes
      </button>
      {aiSummary && <p className="panelTag">{aiSummary}</p>}
      <p className="help">
        Requer a extensão AG Local Bridge ativa no Antigravity em localhost:11435. A IA recebe as legendas com seus tempos; revise o resultado na timeline e use Desfazer se necessário.
      </p>

      <div className="sectionLine">WHISPER LOCAL · TRANSCRIÇÃO</div>
      <label>
        Modelo
        <select value={model} onChange={e => onSetModel(e.target.value)}>
          {['tiny', 'base', 'small', 'medium', 'large'].map(x => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <button onClick={onTranscribe} disabled={!!renderJob}>
        Transcrever vídeo → SRT sincronizado
      </button>
      <button onClick={onTranscribeWords} disabled={!!renderJob}>
        Sincronização por palavra (faster-whisper)
      </button>
      <p className="help">
        Whisper foi instalado localmente. Por palavra, instale faster-whisper se desejar timings ainda mais precisos. FFmpeg é necessário.
      </p>

      <div className="sectionLine">DIREÇÃO CRIATIVA · GEMINI</div>
      <button onClick={onSuggestStyles} disabled={!!renderJob}>
        ✦ Gemini sugere estilos
      </button>
      <p className="help">
        Gemini escolhe estilos por legenda via AG Local Bridge; o texto não é alterado.
      </p>
      <button onClick={onSmartStyle}>Sugestões rápidas sem IA</button>

      <div className="sectionLine">ENQUADRAMENTO · GEMINI</div>
      <button onClick={onSuggestGeminiFraming} disabled={!!renderJob}>
        ✦ Gemini sugere enquadramento
      </button>
      <button onClick={onFaceReframe}>Detectar rosto + keyframes (local)</button>
      <button onClick={onAutoZoom}>Criar zooms nos destaques (regras locais)</button>
      <button onClick={onCutSilences} disabled={!!renderJob}>
        Cortar pausas automaticamente
      </button>
      <p className="help">
        Gemini cria keyframes de enquadramento a partir do contexto das legendas. Detecção de rosto e zoom por regra continuam locais.
      </p>
    </div>
  );
};
