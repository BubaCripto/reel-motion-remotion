import React from 'react';
import type {ReelProject} from '../../lib/project';
import {durationFrames,seconds,saveJson} from '../../lib/project';
import {collectProjectMedia} from '../../lib/media';

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
  mediaStatus?: Record<string, 'checking' | 'available' | 'missing'>;
  onCheckMedia?: () => void;
  onRelinkMedia?: (src: string, file?: File) => void;
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
  onNewProject,
  mediaStatus = {},
  onCheckMedia,
  onRelinkMedia
}) => {
  const media = collectProjectMedia(project);
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
        <button onClick={onSave} title="Salva somente a configuração neste navegador">Salvar no navegador</button>
        <button onClick={() => saveJson(project)}>Exportar JSON</button>
      </div>
      <button onClick={onPickJson}>Abrir JSON salvo</button>

      <div className="sectionLine">CENTRAL DE MÍDIA</div>
      <p className="help">Confira os arquivos antes da exportação. Relinkar preserva cortes, posição e animações.</p>
      <button onClick={onCheckMedia}>Verificar arquivos do projeto</button>
      {!media.length && <p className="help">Este projeto ainda não usa arquivos importados.</p>}
      {media.map(asset => {
        const status = mediaStatus[asset.src] || 'checking';
        const label = status === 'available' ? '✓ Disponível' : status === 'missing' ? '⚠ Ausente' : '○ Não verificado';
        return <div className="savedItem" key={asset.src}>
          <strong>{asset.label}</strong>
          <small>{asset.kind} · usado em {asset.uses} {asset.uses === 1 ? 'item' : 'itens'}</small>
          <small className={status === 'missing' ? 'mediaMissing' : status === 'available' ? 'mediaAvailable' : ''}>{label}</small>
          <small title={asset.src}>{asset.src.split('/').pop()}</small>
          <label className="relinkButton">
            Relinkar arquivo
            <input type="file" accept={asset.kind === 'video' ? 'video/*,.mov' : asset.kind === 'audio' ? 'audio/*' : asset.kind === 'image' ? 'image/*' : '.woff,.woff2,.ttf,.otf'} onChange={event => {
              onRelinkMedia?.(asset.src, event.target.files?.[0]);
              event.target.value = '';
            }} />
          </label>
        </div>;
      })}
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

