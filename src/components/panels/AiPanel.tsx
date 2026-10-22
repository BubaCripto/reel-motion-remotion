import type { DirectorStyle, DirectorIntensity } from '../../lib/motionCompiler';

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
  motionStyle: DirectorStyle;
  onSetMotionStyle: (s: DirectorStyle) => void;
  motionIntensity: DirectorIntensity;
  onSetMotionIntensity: (i: DirectorIntensity) => void;
  onDirectAiMotion: () => void;
  isDirectingMotion: boolean;
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
  onCutSilences,
  motionStyle,
  onSetMotionStyle,
  motionIntensity,
  onSetMotionIntensity,
  onDirectAiMotion,
  isDirectingMotion
}) => {
  return (
    <div className="fields">
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 224, 67, 0.12), rgba(0, 240, 255, 0.08))',
        border: '1px solid rgba(255, 224, 67, 0.4)',
        borderRadius: 10,
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 8px', color: '#ffe043', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎬</span> DIREÇÃO DE MOTION GRAPHICS
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#e2e8f0', lineHeight: 1.4 }}>
          Gera motion design profissional frase por frase: tipografia cinética 3D, trim paths vetoriais, partículas, velocidade e sound design sincronizado.
        </p>

        <label style={{ display: 'block', marginBottom: 10 }}>
          Estilo Visual
          <select value={motionStyle} onChange={e => onSetMotionStyle(e.target.value as any)}>
            <option value="viral-after-effects">🔥 Viral After Effects (Neon + 3D Tilt + Bursts)</option>
            <option value="cyber-tech">⚡ Cyber Tech HUD (Retículos + Rede Neural + Glitch)</option>
            <option value="minimalist-editorial">🖋️ Minimalista Editorial (Ampulheta + Traços Finos)</option>
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 14 }}>
          Ritmo / Intensidade
          <select value={motionIntensity} onChange={e => onSetMotionIntensity(e.target.value as any)}>
            <option value="subtle">Discreto (Foco nas principais palavras e CTA)</option>
            <option value="balanced">Equilibrado (Cenas a cada 4-7s)</option>
            <option value="aggressive">Agressivo / Alta Energia (A cada 2-3s estilo viral)</option>
          </select>
        </label>

        <button
          className="accentBtn"
          onClick={onDirectAiMotion}
          disabled={!!renderJob || isDirectingMotion || !hasCues}
          style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 800 }}
        >
          {isDirectingMotion ? 'Gerando Motion Graphics...' : '✨ Criar Motion Graphics Completo com IA'}
        </button>
      </div>

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
