import React from 'react';
import type {Cue,ReelProject,VideoClip} from '../../lib/project';
import {formatFps} from '../../lib/frame-rate';
import {SourceFrameRates} from '../../features/SourceFrameRates';

type Props = {
  project: ReelProject;
  clip: VideoClip | undefined;
  cue: Cue | undefined;
  sourceRates: any;
  onUseSourceFps: () => void;
  onSplitClip: () => void;
  onTrimClipAtPlayhead: (side: 'left' | 'right') => void;
  snapEnabled: boolean;
  onSetSnapEnabled: (v: boolean) => void;
  wordExpanded: boolean;
  onToggleWordExpanded: () => void;
  onSplitCueWords: () => void;
  onAnalyzeRhythm: () => void;
  onLoadDemo: () => void;
  onPickVideo: () => void;
  onPickSrt: () => void;
  onPickAudio: () => void;
  onPickImage: () => void;
  onPickFont: () => void;
};

export const SidebarRight: React.FC<Props> = ({
  project: p,
  clip,
  cue,
  sourceRates,
  onUseSourceFps,
  onSplitClip,
  onTrimClipAtPlayhead,
  snapEnabled,
  onSetSnapEnabled,
  wordExpanded,
  onToggleWordExpanded,
  onSplitCueWords,
  onAnalyzeRhythm,
  onLoadDemo,
  onPickVideo,
  onPickSrt,
  onPickAudio,
  onPickImage,
  onPickFont
}) => {
  return (
    <aside className="rightPanel">
      <h3>PRODUÇÃO</h3>
      <p>Ferramentas para editar legendas, palavras, cortes, efeitos e elementos gráficos na mesma timeline.</p>
      <div className="sectionLine">AÇÕES RÁPIDAS</div>
      <button onClick={onAnalyzeRhythm}>✦ Analisar ritmo</button>
      <button onClick={onLoadDemo}>▣ Carregar demo completo</button>
      <div className="buttonRow"><button onClick={onPickVideo}>+ Vídeo</button><button onClick={onPickSrt}>+ SRT</button></div>
      <div className="buttonRow"><button onClick={onPickAudio}>+ Áudio</button><button onClick={onPickImage}>+ Imagem</button></div>
      <button onClick={onPickFont}>+ Fonte</button>
      <SourceFrameRates project={p} state={sourceRates} onUseSource={onUseSourceFps} />
      <div className="shortcut">
        <b>Espaço</b>
        <span>Reproduzir / pausar</span>
      </div>
      <div className="shortcut">
        <b>Ctrl + Z</b>
        <span>Desfazer</span>
      </div>
      <div className="shortcut">
        <b>Ctrl + Y / Ctrl + Shift + Z</b>
        <span>Refazer</span>
      </div>
      <div className="shortcut">
        <b>Ctrl + Shift + A</b>
        <span>Selecionar legendas geradas</span>
      </div>
      <div className="shortcut">
        <b>Ctrl + D</b>
        <span>Duplicar</span>
      </div>
      <div className="shortcut">
        <b>Del</b>
        <span>Excluir</span>
      </div>

      <div className="sectionLine">CORTES</div>
      <p>Com um clipe selecionado, o playhead define o ponto de corte.</p>
      <button onClick={onSplitClip} disabled={!clip}>
        ✂ Dividir no playhead
      </button>
      <button onClick={() => onTrimClipAtPlayhead('left')} disabled={!clip}>
        ⌫ Cortar e apagar à esquerda
      </button>
      <button onClick={() => onTrimClipAtPlayhead('right')} disabled={!clip}>
        Cortar e apagar à direita ⌦
      </button>
      <label className="check">
        <input
          type="checkbox"
          checked={snapEnabled}
          onChange={e => onSetSnapEnabled(e.target.checked)}
        />{' '}
        Ímã: encaixar cortes e trilhas
      </label>

      <div className="sectionLine">EDIÇÃO PRECISA</div>
      <p>
        Arraste o bloco na timeline para mover. Arraste suas bordas para cortar. Arraste em área vazia de uma faixa de texto para selecionar vários itens dela.
      </p>
      <button onClick={onToggleWordExpanded}>
        {wordExpanded ? 'Ocultar' : 'Mostrar'} faixa de palavras
      </button>
      <button onClick={onSplitCueWords} disabled={!cue}>
        Separar legenda em palavras
      </button>

      <div className="sectionLine">SAÍDA</div>
      <p>
        MP4 · H.264 · {p.width} × {p.height} · {formatFps(p.fps)} fps · legendas incorporadas.
      </p>
      <p className="help">
        Sem renderização em nuvem. O Remotion CLI e codecs precisam estar disponíveis no computador.
      </p>
    </aside>
  );
};
