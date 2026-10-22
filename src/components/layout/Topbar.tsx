import React from 'react';
import type {AspectRatioPreset, ColorGradePreset, ReelProject} from '../../lib/project';
import {ASPECT_RATIOS} from '../../lib/project';

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
  onCancelRender?: () => void;
  onSelectAspectRatio?: (ratio: AspectRatioPreset) => void;
  onSelectColorGrade?: (grade: ColorGradePreset) => void;
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
  onExportMp4,
  onCancelRender,
  onSelectAspectRatio,
  onSelectColorGrade
}) => {
  const currentRatio: AspectRatioPreset = project.aspectRatio || (project.width === 1920 ? '16:9' : project.width === project.height ? '1:1' : project.height === 1350 ? '4:5' : '9:16');
  const currentColorGrade: ColorGradePreset = project.colorGrade || 'none';

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
        {/* Aspect Ratio Switcher */}
        {onSelectAspectRatio && (
          <select
            style={{background: '#22242e', color: '#f3c46b', border: '1px solid #4f4728', borderRadius: 6, padding: '7px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer'}}
            value={currentRatio}
            onChange={e => onSelectAspectRatio(e.target.value as AspectRatioPreset)}
            title="Formato de Tela / Aspect Ratio"
          >
            {Object.entries(ASPECT_RATIOS).map(([key, info]) => (
              <option key={key} value={key}>📐 {info.label}</option>
            ))}
          </select>
        )}

        {/* Color Grading Selector */}
        {onSelectColorGrade && (
          <select
            style={{background: '#22242e', color: '#e8e8ee', border: '1px solid #3c3e4b', borderRadius: 6, padding: '7px 10px', fontSize: 11, cursor: 'pointer'}}
            value={currentColorGrade}
            onChange={e => onSelectColorGrade(e.target.value as ColorGradePreset)}
            title="Filtro de Cor / Color Grading"
          >
            <option value="none">🎨 Cor Natural</option>
            <option value="teal-orange">🎬 Teal & Orange</option>
            <option value="moody-dark">🌑 Moody Dark</option>
            <option value="clean-bright">✨ Clean Bright</option>
            <option value="cyber-neon">⚡ Cyber Neon</option>
            <option value="monochrome">🎞 P&B Contrast</option>
          </select>
        )}

        <button onClick={onAnalyzeRhythm}>✦ Analisar ritmo</button>
        <button onClick={onLoadDemo}>▣ Demo completo</button>
        <button onClick={onPickVideo}>+ Vídeo</button>
        <button onClick={onPickSrt}>+ SRT</button>
        <button onClick={onPickAudio}>+ Áudio</button>
        <button onClick={onPickImage}>+ Imagem</button>
        <button onClick={onPickFont}>+ Fonte</button>
        <button onClick={onSave}>Salvar</button>

        {renderJob && onCancelRender ? (
          <div style={{display: 'flex', gap: 6, alignItems: 'center'}}>
            <button className="accentBtn" disabled style={{opacity: 0.8}}>
              ◌ Renderizando...
            </button>
            <button
              onClick={onCancelRender}
              style={{background: '#d32f2f', color: '#fff', borderColor: '#b71c1c', fontWeight: 700}}
              title="Interromper renderização imediatamente"
            >
              ✕ Cancelar
            </button>
          </div>
        ) : (
          <button className="accentBtn" disabled={!!renderJob} onClick={onExportMp4}>
            ⬇ Exportar MP4{project.rhythmVariant ? ' · ' + project.rhythmVariant.label : ''}
          </button>
        )}
      </div>
    </header>
  );
};

