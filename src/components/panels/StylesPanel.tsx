import React from 'react';
import type {Cue,Preset,ReelProject} from '../../lib/project';
import {colorField} from '../common/InputNumber';
import {categories,labelName,type BrandKit} from '../../types/editor';

type Props = {
  project: ReelProject;
  cue: Cue | undefined;
  selectedCueIds: string[];
  applyToAllSelected: boolean;
  onSetApplyToAllSelected: (v: boolean) => void;
  onSelectPreset: (preset: Preset) => void;
  onAddStyledCue: (preset: Preset) => void;
  onChangeProject: (patch: Partial<ReelProject>, undo?: boolean) => void;
  kitName: string;
  onSetKitName: (name: string) => void;
  brandKits: BrandKit[];
  onSaveKit: () => void;
  onUseKit: (kit: BrandKit) => void;
  onRenameKit: (id: string, name: string) => void;
  onDuplicateKit: (kit: BrandKit) => void;
  onDeleteKit: (id: string) => void;
  onExportKit: (kit: BrandKit) => void;
};

export const StylesPanel: React.FC<Props> = ({
  project: p,
  cue,
  selectedCueIds,
  applyToAllSelected,
  onSetApplyToAllSelected,
  onSelectPreset,
  onAddStyledCue,
  onChangeProject,
  kitName,
  onSetKitName,
  brandKits,
  onSaveKit,
  onUseKit,
  onRenameKit,
  onDuplicateKit,
  onDeleteKit,
  onExportKit
}) => {
  return (
    <div className="fields">
      <h3>BIBLIOTECA DE ESTILOS</h3>
      <p>
        {cue && selectedCueIds.length > 1 && applyToAllSelected
          ? `Aplicando preset às ${selectedCueIds.length} legendas selecionadas.`
          : 'Selecione um bloco na timeline para aplicar o preset somente a ele.'}
      </p>
      {cue && selectedCueIds.length > 1 && (
        <label className="check" style={{marginBottom: 10, fontWeight: 600}}>
          <input
            type="checkbox"
            checked={applyToAllSelected}
            onChange={e => onSetApplyToAllSelected(e.target.checked)}
          />{' '}
          Aplicar a todas as {selectedCueIds.length} legendas selecionadas
        </label>
      )}
      <button
        className="accentBtn"
        onClick={() => onAddStyledCue(cue?.preset ?? p.preset)}
      >
        + Adicionar “{labelName(cue?.preset ?? p.preset)}” na timeline
      </button>
      <p className="help">Cria um texto manual editável no playhead, usando o estilo selecionado. Não depende da IA.</p>
      {categories.map(cat => (
        <div key={cat.title}>
          <div className="sectionLine">{cat.title}</div>
          <div className="presetGrid">
            {cat.list.map((pr, i) => (
              <button
                key={pr}
                className={(cue?.preset ?? p.preset) === pr ? 'active' : ''}
                onClick={() => onSelectPreset(pr)}
              >
                <span
                  className="presetIcon"
                  style={{transform: `rotate(${i % 3 === 0 ? -4 : i % 3 === 1 ? 5 : 0}deg)`}}
                >
                  Aa
                </span>
                <small>{labelName(pr)}</small>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="sectionLine">PADRÃO DO PROJETO</div>
      <label>
        Criatividade {p.creativity}%
        <input
          type="range"
          min="0"
          max="100"
          value={p.creativity}
          onChange={e => onChangeProject({creativity: +e.target.value}, false)}
        />
      </label>
      {colorField('Cor principal', p.foreground, v => onChangeProject({foreground: v}))}
      {colorField('Cor de destaque', p.accent, v => onChangeProject({accent: v}))}
      {colorField('Fundo sem vídeo', p.background, v => onChangeProject({background: v}))}
      <div className="sectionLine">IDENTIDADES VISUAIS</div>
      <label>
        Nome do estilo
        <input value={kitName} onChange={e => onSetKitName(e.target.value)} />
      </label>
      <button onClick={onSaveKit}>+ Salvar identidade atual</button>
      {brandKits.map(b => (
        <div className="savedItem" key={b.id}>
          <label>Nome da identidade<input value={b.name} onChange={e => onRenameKit(b.id, e.target.value)} /></label>
          <div className="kitSwatch">
            <i style={{background: b.background}} />
            <i style={{background: b.foreground}} />
            <i style={{background: b.accent}} />
          </div>
          <button onClick={() => onUseKit(b)}>Aplicar identidade como padrão</button>
          <div className="buttonRow"><button onClick={() => onDuplicateKit(b)}>Duplicar</button><button onClick={() => onExportKit(b)}>Exportar JSON</button></div>
          <button className="delete" onClick={() => onDeleteKit(b.id)}>Excluir identidade</button>
        </div>
      ))}
    </div>
  );
};
