import React from 'react';
import type {ReelProject} from '../../lib/project';

type Props = {
  project: ReelProject;
  renderJob: string;
  onAnalyzeRhythm: () => void;
  onLoadDemo: () => void;
  onPickVideo: () => void;
  onPickSrt: () => void;
  onPickAudio: () => void;
  onPickImage: () => void;
  onPickFont: () => void;
  onSave: () => void;
  onExportMp4: () => void;
};

export const Topbar: React.FC<Props> = ({
  project,
  renderJob,
  onAnalyzeRhythm,
  onLoadDemo,
  onPickVideo,
  onPickSrt,
  onPickAudio,
  onPickImage,
  onPickFont,
  onSave,
  onExportMp4
}) => {
  return (
    <header className="topbar">
      <div className="appBrand">
        <span className="brandMark">R<span>●</span></span>
        <div>
          <strong>REEL MOTION STUDIO <em>V6</em></strong>
          <small>REMOTION · MOTION TYPOGRAPHY & REELS</small>
        </div>
      </div>
      <div className="topActions">
        <button onClick={onAnalyzeRhythm}>✦ Analisar ritmo</button>
        <button onClick={onLoadDemo}>▣ Demo completo</button>
        <button onClick={onPickVideo}>+ Vídeo</button>
        <button onClick={onPickSrt}>+ SRT</button>
        <button onClick={onPickAudio}>+ Áudio</button>
        <button onClick={onPickImage}>+ Imagem</button>
        <button onClick={onPickFont}>+ Fonte</button>
        <button onClick={onSave}>Salvar</button>
        <button className="accentBtn" disabled={!!renderJob} onClick={onExportMp4}>
          ⬇ Exportar MP4{project.rhythmVariant ? ' · ' + project.rhythmVariant.label : ''}
        </button>
      </div>
    </header>
  );
};
