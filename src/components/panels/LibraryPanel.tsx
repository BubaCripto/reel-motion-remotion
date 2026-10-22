import React from 'react';
import type {ReelProject} from '../../lib/project';
import {durationFrames,seconds,saveJson} from '../../lib/project';

type Props = {
  library: ReelProject[];
  project: ReelProject;
  renderJob: string;
  batchFiles: string[];
  onSave: () => void;
  onOpenProject: (p: ReelProject) => void;
  onDeleteProject: (id: string) => void;
  onPickJson: () => void;
  onBatchRender: () => void;
};

export const LibraryPanel: React.FC<Props> = ({
  library,
  project,
  renderJob,
  batchFiles,
  onSave,
  onOpenProject,
  onDeleteProject,
  onPickJson,
  onBatchRender
}) => {
  return (
    <div className="fields">
      <h3>PROJETOS SALVOS</h3>
      <div className="buttonRow">
        <button onClick={onSave}>Salvar atual</button>
        <button onClick={() => saveJson(project)}>Exportar JSON</button>
      </div>
      <button onClick={onPickJson}>Abrir JSON salvo</button>
      <div className="sectionLine">{library.length} projetos armazenados</div>
      {library.map(v => (
        <div className="savedItem" key={v.id}>
          <strong>{v.name}</strong>
          <small>{v.cues.length} legendas · {seconds(durationFrames(v) / v.fps)}</small>
          <div className="buttonRow">
            <button onClick={() => onOpenProject(v)}>Abrir</button>
            <button onClick={() => saveJson(v)}>JSON</button>
            <button className="delete" onClick={() => onDeleteProject(v.id)}>×</button>
          </div>
        </div>
      ))}
      <div className="sectionLine">RENDER EM LOTE</div>
      <button onClick={onBatchRender} disabled={!library.length || !!renderJob}>
        Renderizar todos os projetos salvos
      </button>
      {batchFiles.map((v, i) => (
        <a className="renderLink" href={v} download key={i}>
          MP4 finalizado #{i + 1}
        </a>
      ))}
      <p className="help">
        A biblioteca salva configurações, não copia vídeos. Preserve a pasta public/media.
      </p>
    </div>
  );
};
