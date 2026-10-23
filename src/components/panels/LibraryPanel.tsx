import React from 'react';
import type {ReelProject} from '../../lib/project';
import {durationFrames,seconds,saveJson} from '../../lib/project';

type Props = {
  library: ReelProject[];
  project: ReelProject;
  renderJob: string;
  batchFiles: string[];
  storageInfo?: { renderCount: number; renderMb: number } | null;
  onSave: () => void;
  onOpenProject: (p: ReelProject) => void;
  onDeleteProject: (id: string) => void;
  onPickJson: () => void;
  onBatchRender: () => void;
  onCleanStorage?: () => void;
  onNewProject?: () => void;
};

export const LibraryPanel: React.FC<Props> = ({
  library,
  project,
  renderJob,
  batchFiles,
  storageInfo,
  onSave,
  onOpenProject,
  onDeleteProject,
  onPickJson,
  onBatchRender,
  onCleanStorage,
  onNewProject
}) => {
  return (
    <div className="fields">
      <h3>PROJETOS SALVOS</h3>
      {onNewProject && (
        <button
          onClick={onNewProject}
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: '#fff',
            borderColor: '#818cf8',
            fontWeight: 700,
            padding: '10px 14px',
            marginBottom: 12,
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
          }}
        >
          ✨ Iniciar Novo Projeto do Zero
        </button>
      )}
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

      {onCleanStorage && (
        <>
          <div className="sectionLine">ARMAZENAMENTO & CACHE</div>
          {storageInfo ? (
            <p style={{fontSize: 11, color: '#aaa'}}>
              Renders em disco: <strong>{storageInfo.renderCount} arquivos</strong> ({storageInfo.renderMb} MB)
            </p>
          ) : null}
          <button onClick={onCleanStorage} style={{background: '#2c2525', borderColor: '#5c3a3a'}}>
            🧹 Limpar renders antigos e temporários
          </button>
        </>
      )}

      <p className="help">
        A biblioteca salva configurações, não copia vídeos. Preserve a pasta public/media.
      </p>
    </div>
  );
};

