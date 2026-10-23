import React from 'react';
import type {MotionOverlayType, Overlay} from '../../lib/project';
import {labelName} from '../../types/editor';

type Props = {
  addText: string;
  onSetAddText: (t: string) => void;
  onAddOverlay: (kind: Overlay['kind'], type?: Overlay['type']) => void;
  onAddMotionOverlay?: (type: MotionOverlayType) => void;
  onPickImage: () => void;
  onInsertCue: () => void;
  onAnalyzeAudio: (file?: File) => void;
};

export const EffectsPanel: React.FC<Props> = ({
  addText,
  onSetAddText,
  onAddOverlay,
  onAddMotionOverlay,
  onPickImage,
  onInsertCue,
  onAnalyzeAudio
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
