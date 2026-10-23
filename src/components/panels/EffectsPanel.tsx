import React from 'react';
import type {MotionOverlayType, Overlay} from '../../lib/project';
import type {MotionSceneId} from '../../lib/motionCatalog';
import {labelName} from '../../types/editor';
import {SFX_OPTIONS} from '../../lib/sfx';

type Props = {
  addText: string;
  onSetAddText: (t: string) => void;
  onAddOverlay: (kind: Overlay['kind'], type?: Overlay['type']) => void;
  onAddMotionOverlay?: (type: MotionOverlayType) => void;
  onAddMotionScene?: (scene: MotionSceneId) => void;
  onPickImage: () => void;
  onInsertCue: () => void;
  onAnalyzeAudio: (file?: File) => void;
  onAddSfx: (file: string, label: string) => void;
};

export const EffectsPanel: React.FC<Props> = ({
  addText,
  onSetAddText,
  onAddOverlay,
  onAddMotionOverlay,
  onAddMotionScene,
  onPickImage,
  onInsertCue,
  onAnalyzeAudio,
  onAddSfx
}) => {
  return (
    <div className="fields">
      <h3>CAMADAS & ELEMENTOS</h3>
      <p>Adicione elementos independentes com tempo, posição e keyframes próprios.</p>

      {onAddMotionOverlay && (
        <>
          <div className="sectionLine" style={{color: '#f472b6'}}>⚡ MOTION GRAPHICS (AFTER EFFECTS)</div>
          <div className="presetGrid actions">
            <button
              onClick={() => onAddMotionOverlay('kinetic-text')}
              style={{background: 'linear-gradient(135deg, #4c1d95, #831843)', borderColor: '#d946ef', color: '#fff'}}
            >
              + 🔤 Kinetic Text
            </button>
            <button
              onClick={() => onAddMotionOverlay('scene')}
              style={{background: 'linear-gradient(135deg, #1e1b4b, #065f46)', borderColor: '#34d399', color: '#fff'}}
            >
              + 📈 Cena Semântica
            </button>
            <button
              onClick={() => onAddMotionOverlay('stroke-path')}
              style={{background: 'linear-gradient(135deg, #1e293b, #78350f)', borderColor: '#facc15', color: '#fff'}}
            >
              + ✏️ Trim Path
            </button>
            <button
              onClick={() => onAddMotionOverlay('burst')}
              style={{background: 'linear-gradient(135deg, #1e293b, #831843)', borderColor: '#fb7185', color: '#fff'}}
            >
              + ✨ Bursts
            </button>
            <button
              onClick={() => onAddMotionOverlay('speed-lines')}
              style={{background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', borderColor: '#38bdf8', color: '#fff'}}
            >
              + ⚡ Speed Lines
            </button>
            <button
              onClick={() => onAddMotionOverlay('camera-shake')}
              style={{background: 'linear-gradient(135deg, #27272a, #450a0a)', borderColor: '#f87171', color: '#fff'}}
            >
              + 📳 Camera Shake
            </button>
          </div>
          {onAddMotionScene && (
            <>
              <div className="sectionLine" style={{color: '#5eead4'}}>MOTIONS PARA REELS</div>
              <div className="presetGrid actions">
                <button onClick={() => onAddMotionScene('social-cta')}>+ ♥ CTA social</button>
                <button onClick={() => onAddMotionScene('social-comment')}>+ 💬 Comentário / DM</button>
                <button onClick={() => onAddMotionScene('metric-counter')}>+ # Contador</button>
                <button onClick={() => onAddMotionScene('comparison')}>+ ⇄ Antes × Depois</button>
                <button onClick={() => onAddMotionScene('checklist')}>+ ✓ Checklist</button>
                <button onClick={() => onAddMotionScene('progress-bar')}>+ ▰ Progresso</button>
                <button onClick={() => onAddMotionScene('focus-spotlight')}>+ ⌕ Foco / Lupa</button>
                <button onClick={() => onAddMotionScene('calendar-clock')}>+ ⏱ Prazo / Tempo</button>
                <button onClick={() => onAddMotionScene('social-notification')}>+ 🔔 Notificação</button>
                <button onClick={() => onAddMotionScene('social-profile')}>+ ◉ Perfil social</button>
                <button onClick={() => onAddMotionScene('search-bar')}>+ ⌕ Busca</button>
                <button onClick={() => onAddMotionScene('cursor-click')}>+ ➤ Cursor / clique</button>
                <button onClick={() => onAddMotionScene('glitch-rgb')}>+ ▧ Glitch RGB</button>
                <button onClick={() => onAddMotionScene('impact-flash')}>+ ✦ Flash</button>
                <button onClick={() => onAddMotionScene('crt-vhs')}>+ ▤ CRT / VHS</button>
                <button onClick={() => onAddMotionScene('confetti')}>+ 🎉 Confete</button>
                <button onClick={() => onAddMotionScene('bar-chart')}>+ ▥ Barras</button>
                <button onClick={() => onAddMotionScene('conversion-funnel')}>+ ▽ Funil</button>
                <button onClick={() => onAddMotionScene('ranking-podium')}>+ ♛ Ranking</button>
                <button onClick={() => onAddMotionScene('timeline-steps')}>+ — Timeline</button>
                <button onClick={() => onAddMotionScene('radar-scan')}>+ ◉ Radar</button>
                <button onClick={() => onAddMotionScene('domino-effect')}>+ ▯ Dominó</button>
                <button onClick={() => onAddMotionScene('traffic-light')}>+ ● Semáforo</button>
                <button onClick={() => onAddMotionScene('balance-scale')}>+ ⚖ Balança</button>
              </div>
            </>
          )}
        </>
      )}

      <div className="sectionLine">FORMAS & ELEMENTOS CLÁSSICOS</div>
      <div className="presetGrid actions">
        {(['rectangle', 'circle', 'arrow', 'line', 'scribble'] as const).map(t => (
          <button key={t} onClick={() => onAddOverlay('shape', t)}>
            + {labelName(t)}
          </button>
        ))}
        <button onClick={() => onAddOverlay('text')}>+ Texto livre</button>
        <button onClick={() => onAddOverlay('effect', 'flash')}>+ Flash</button>
        <button onClick={() => onAddOverlay('effect', 'vignette')}>+ Vinheta</button>
        <button onClick={() => onAddOverlay('effect', 'grain')}>+ Grain</button>
        <button onClick={onPickImage}>+ PNG/SVG</button>
      </div>

      <div className="sectionLine">CRIAR LEGENDA</div>
      <label>
        Texto
        <textarea rows={2} value={addText} onChange={e => onSetAddText(e.target.value)} />
      </label>
      <button onClick={onInsertCue}>+ Criar legenda no playhead</button>

      <div className="sectionLine">ANIMAÇÕES DE ÁUDIO</div>
      <p className="help">Insira um efeito no playhead, depois ajuste duração, volume e ducking em Editar.</p>
      <div className="presetGrid actions">
        {SFX_OPTIONS.map(sfx => <button key={sfx.file} onClick={() => onAddSfx(sfx.file, sfx.label)}>+ {sfx.label}</button>)}
      </div>
      <label>
        Importar arquivo para detectar picos
        <input type="file" accept="audio/*" onChange={e => onAnalyzeAudio(e.target.files?.[0])} />
      </label>
      <p className="help">
        Análise de amplitude: cria flashes discretos nos picos identificados. Não é detecção musical perfeita.
      </p>
    </div>
  );
};
