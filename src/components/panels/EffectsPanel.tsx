import React from 'react';
import type {Overlay} from '../../lib/project';
import {labelName} from '../../types/editor';

type Props = {
  addText: string;
  onSetAddText: (t: string) => void;
  onAddOverlay: (kind: Overlay['kind'], type?: Overlay['type']) => void;
  onPickImage: () => void;
  onInsertCue: () => void;
  onAnalyzeAudio: (file?: File) => void;
};

export const EffectsPanel: React.FC<Props> = ({
  addText,
  onSetAddText,
  onAddOverlay,
  onPickImage,
  onInsertCue,
  onAnalyzeAudio
}) => {
  return (
    <div className="fields">
      <h3>CAMADAS & ELEMENTOS</h3>
      <p>Adicione elementos independentes com tempo, posição e keyframes próprios.</p>
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
