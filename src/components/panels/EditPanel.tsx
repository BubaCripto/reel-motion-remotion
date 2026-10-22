import React from 'react';
import type {Cue,Keyframe,Overlay,Preset,ReelProject,VideoClip,Word} from '../../lib/project';
import {clamp,isTranscript,splitWords,seconds} from '../../lib/project';
import {InputNumber,colorField} from '../common/InputNumber';
import {categories,labelName,type Selection} from '../../types/editor';

type Props = {
  project: ReelProject;
  selected: Selection | null;
  selectedCueIds: string[];
  applyToAllSelected: boolean;
  onSetApplyToAllSelected: (v: boolean) => void;
  cue: Cue | undefined;
  word: Word | undefined;
  overlay: Overlay | undefined;
  clip: VideoClip | undefined;
  fonts: string[];
  cursor: number;
  keyframeMode: boolean;
  renderJob: string;
  onSelect: (s: Selection | null) => void;
  onEditCue: (id: string, patch: Partial<Cue>, undo?: boolean) => void;
  onEditWord: (cueId: string, wordId: string, patch: Partial<Word>) => void;
  onEditLayer: (id: string, patch: Partial<Overlay>, undo?: boolean) => void;
  onEditClip: (id: string, patch: Partial<VideoClip>, undo?: boolean) => void;
  onSplitClip: () => void;
  onFaceReframe: () => void;
  onAutoZoom: () => void;
  onCutSilences: () => void;
  onSetKeyframeMode: (v: boolean) => void;
  onAddKeyframe: () => void;
  onDuplicate: () => void;
  onDeleteSelection: () => void;
};

export const EditPanel: React.FC<Props> = ({
  project: p,
  selected,
  selectedCueIds,
  applyToAllSelected,
  onSetApplyToAllSelected,
  cue,
  word,
  overlay,
  clip,
  fonts,
  cursor,
  keyframeMode,
  renderJob,
  onSelect,
  onEditCue,
  onEditWord,
  onEditLayer,
  onEditClip,
  onSplitClip,
  onFaceReframe,
  onAutoZoom,
  onCutSilences,
  onSetKeyframeMode,
  onAddKeyframe,
  onDuplicate,
  onDeleteSelection
}) => {
  const presetSelect = (value: Preset, onChange: (v: Preset) => void) => (
    <select value={value} onChange={e => onChange(e.target.value as Preset)}>
      {categories.map(cat => (
        <optgroup key={cat.title} label={cat.title}>
          {cat.list.map(v => (
            <option key={v} value={v}>
              {labelName(v)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );

  return (
    <div className="fields">
      <h3>PROPRIEDADES</h3>
      {cue && (
        <>
          {selected?.kind === 'word' ? (
            <div className="panelTag">
              Palavra selecionada · {isTranscript(cue) ? 'faixa de transcrição' : 'faixa de textos do projeto'}
            </div>
          ) : selectedCueIds.length > 1 && selectedCueIds.includes(cue.id) ? (
            <>
              <div
                className="panelTag"
                style={{
                  background: 'rgba(232,189,85,.18)',
                  borderColor: '#e8bd55',
                  color: '#ffe082'
                }}
              >
                ✦ {selectedCueIds.length} legendas selecionadas na timeline
              </div>
              <label className="check" style={{marginBottom: 10, fontWeight: 600}}>
                <input
                  type="checkbox"
                  checked={applyToAllSelected}
                  onChange={e => onSetApplyToAllSelected(e.target.checked)}
                />{' '}
                Aplicar alterações a todas as {selectedCueIds.length} selecionadas
              </label>
            </>
          ) : (
            <div className="panelTag">
              {isTranscript(cue) ? 'Legenda gerada' : 'Texto manual / estilo'} ·{' '}
              {isTranscript(cue) ? 'faixa de transcrição' : 'faixa de textos do projeto'}
            </div>
          )}

          {selected?.kind === 'word' && word ? (
            <>
              <label>
                Palavra
                <input
                  value={word.text}
                  onChange={e => onEditWord(cue.id, word.id, {text: e.target.value})}
                />
              </label>
              <div className="duo">
                <InputNumber
                  name="Início"
                  value={word.start}
                  onChange={v =>
                    onEditWord(cue.id, word.id, {
                      start: Math.min(word.end - 0.033, Math.max(cue.start, v))
                    })
                  }
                />
                <InputNumber
                  name="Fim"
                  value={word.end}
                  onChange={v =>
                    onEditWord(cue.id, word.id, {
                      end: Math.max(word.start + 0.033, Math.min(cue.end, v))
                    })
                  }
                />
              </div>
              <label>
                Motion da palavra
                {presetSelect(word.preset ?? cue.preset ?? p.preset, v =>
                  onEditWord(cue.id, word.id, {preset: v})
                )}
              </label>
              {colorField('Cor da palavra', word.accent ?? cue.accent ?? p.accent, v =>
                onEditWord(cue.id, word.id, {accent: v})
              )}
              <InputNumber
                name="Escala da palavra"
                value={word.scale ?? 1}
                step={0.05}
                onChange={v => onEditWord(cue.id, word.id, {scale: v})}
              />
              <div className="duo">
                <InputNumber
                  name="Offset X"
                  value={word.offsetX ?? 0}
                  onChange={v => onEditWord(cue.id, word.id, {offsetX: v})}
                />
                <InputNumber
                  name="Offset Y"
                  value={word.offsetY ?? 0}
                  onChange={v => onEditWord(cue.id, word.id, {offsetY: v})}
                />
              </div>
              <button onClick={() => onSelect({kind: 'cue', id: cue.id})}>
                ↩ Editar frase completa
              </button>
            </>
          ) : (
            <>
              {(selectedCueIds.length <= 1 || !selectedCueIds.includes(cue.id)) && (
                <>
                  <label>
                    Texto · [PALAVRA] destaca
                    <textarea
                      rows={4}
                      value={cue.text}
                      onChange={e => onEditCue(cue.id, {text: e.target.value, words: undefined})}
                    />
                  </label>
                  <div className="duo">
                    <InputNumber
                      name="Início"
                      value={cue.start}
                      onChange={v =>
                        onEditCue(cue.id, {
                          start: Math.max(0, Math.min(cue.end - 0.033, v)),
                          words: undefined
                        })
                      }
                    />
                    <InputNumber
                      name="Fim"
                      value={cue.end}
                      onChange={v =>
                        onEditCue(cue.id, {
                          end: Math.max(cue.start + 0.033, v),
                          words: undefined
                        })
                      }
                    />
                  </div>
                  <button
                    className="secondaryBtn"
                    onClick={() => onEditCue(cue.id, {words: splitWords(cue)})}
                  >
                    Gerar tempos de cada palavra
                  </button>
                </>
              )}
              <label>
                Preset{' '}
                {selectedCueIds.length > 1 && selectedCueIds.includes(cue.id) && applyToAllSelected
                  ? 'das legendas'
                  : 'desta legenda'}
                {presetSelect(cue.preset ?? p.preset, v => onEditCue(cue.id, {preset: v}))}
              </label>
              <label>
                Fonte A
                <select
                  value={cue.fontA ?? p.fontA}
                  onChange={e => onEditCue(cue.id, {fontA: e.target.value})}
                >
                  {fonts.map(f => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={cue.twoFonts ?? p.twoFonts}
                  onChange={e => onEditCue(cue.id, {twoFonts: e.target.checked})}
                />{' '}
                Misturar duas fontes
              </label>
              {(cue.twoFonts ?? p.twoFonts) && (
                <label>
                  Fonte B
                  <select
                    value={cue.fontB ?? p.fontB}
                    onChange={e => onEditCue(cue.id, {fontB: e.target.value})}
                  >
                    {fonts.map(f => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Peso
                <select
                  value={cue.fontWeight ?? 800}
                  onChange={e => onEditCue(cue.id, {fontWeight: Number(e.target.value)})}
                >
                  {[300, 400, 500, 600, 700, 800, 900].map(w => (
                    <option key={w} value={w}>
                      {w === 400 ? 'Normal (400)' : w === 700 ? 'Negrito (700)' : w}
                    </option>
                  ))}
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={!!cue.italic}
                  onChange={e => onEditCue(cue.id, {italic: e.target.checked})}
                />{' '}
                Itálico
              </label>
              <label>
                Alinhamento
                <select
                  value={cue.align ?? 'center'}
                  onChange={e => onEditCue(cue.id, {align: e.target.value as Cue['align']})}
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </label>
              <label>
                Destaque dos [COLCHETES]
                <select
                  value={cue.highlightMode ?? 'color'}
                  onChange={e =>
                    onEditCue(cue.id, {highlightMode: e.target.value as Cue['highlightMode']})
                  }
                >
                  <option value="color">Cor</option>
                  <option value="box">Tarja</option>
                  <option value="outline">Contorno</option>
                  <option value="underline">Sublinhado</option>
                </select>
              </label>
              {colorField('Cor da fonte', cue.foreground ?? p.foreground, v =>
                onEditCue(cue.id, {foreground: v})
              )}
              {colorField('Cor de destaque', cue.accent ?? p.accent, v =>
                onEditCue(cue.id, {accent: v})
              )}
              <div className="outliner">
                <strong>CONTORNO DA FONTE</strong>
                <div className="duo">
                  <InputNumber
                    name="Espessura px"
                    value={cue.strokeWidth ?? 0}
                    min={0}
                    max={24}
                    step={1}
                    onChange={v => onEditCue(cue.id, {strokeWidth: clamp(v, 0, 24)})}
                  />
                  {colorField('Cor do contorno', cue.strokeColor ?? '#000000', v =>
                    onEditCue(cue.id, {strokeColor: v})
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={cue.strokeWidth ?? 0}
                  onChange={e => onEditCue(cue.id, {strokeWidth: +e.target.value}, false)}
                />
              </div>
              <div className="duo">
                <InputNumber name="X %" value={cue.x ?? 50} onChange={v => onEditCue(cue.id, {x: v})} />
                <InputNumber name="Y %" value={cue.y ?? 70} onChange={v => onEditCue(cue.id, {y: v})} />
              </div>
              <InputNumber
                name="Escala / Tamanho"
                value={cue.scale ?? 0.85}
                onChange={v => onEditCue(cue.id, {scale: v})}
                step={0.05}
              />
              <InputNumber
                name="Rotação °"
                value={cue.rotation ?? 0}
                onChange={v => onEditCue(cue.id, {rotation: v})}
              />
            </>
          )}
        </>
      )}

      {overlay && (
        <>
          <div className="panelTag">Camada independente · {overlay.kind}</div>
          <label>
            Nome
            <input
              value={overlay.name}
              onChange={e => onEditLayer(overlay.id, {name: e.target.value})}
            />
          </label>
          {overlay.kind === 'text' && (
            <>
              <label>
                Texto
                <textarea
                  rows={3}
                  value={overlay.text ?? ''}
                  onChange={e => onEditLayer(overlay.id, {text: e.target.value})}
                />
              </label>
              <label>
                Fonte
                <select
                  value={overlay.fontA ?? p.fontA}
                  onChange={e => onEditLayer(overlay.id, {fontA: e.target.value})}
                >
                  {fonts.map(f => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {colorField('Cor', overlay.color ?? '#ffffff', v => onEditLayer(overlay.id, {color: v}))}
          <div className="duo">
            <InputNumber
              name="Início"
              value={overlay.start}
              onChange={v =>
                onEditLayer(overlay.id, {start: Math.max(0, Math.min(v, overlay.end - 0.033))})
              }
            />
            <InputNumber
              name="Fim"
              value={overlay.end}
              onChange={v =>
                onEditLayer(overlay.id, {end: Math.max(v, overlay.start + 0.033)})
              }
            />
          </div>
          <div className="duo">
            <InputNumber
              name="X %"
              value={overlay.x}
              onChange={v => onEditLayer(overlay.id, {x: v})}
            />
            <InputNumber
              name="Y %"
              value={overlay.y}
              onChange={v => onEditLayer(overlay.id, {y: v})}
            />
          </div>
          <div className="duo">
            <InputNumber
              name="Escala"
              value={overlay.scale}
              onChange={v => onEditLayer(overlay.id, {scale: v})}
            />
            <InputNumber
              name="Rotação °"
              value={overlay.rotation}
              onChange={v => onEditLayer(overlay.id, {rotation: v})}
            />
          </div>
          <InputNumber
            name="Opacidade (0–1)"
            value={overlay.opacity}
            onChange={v => onEditLayer(overlay.id, {opacity: clamp(v, 0, 1)})}
          />
          {overlay.kind === 'audio' && (
            <InputNumber
              name="Volume (0–2)"
              value={overlay.volume ?? 1}
              onChange={v => onEditLayer(overlay.id, {volume: clamp(v, 0, 2)})}
            />
          )}
        </>
      )}

      {clip && (
        <>
          <div className="panelTag">Trecho de vídeo</div>
          <div className="duo">
            <InputNumber
              name="Início"
              value={clip.start}
              onChange={v => onEditClip(clip.id, {start: Math.max(0, v)})}
            />
            <InputNumber
              name="Fim"
              value={clip.end}
              onChange={v => onEditClip(clip.id, {end: Math.max(clip.start + 0.033, v)})}
            />
          </div>
          <div className="duo">
            <InputNumber
              name="Origem (s)"
              value={clip.sourceStart}
              onChange={v => onEditClip(clip.id, {sourceStart: Math.max(0, v)})}
            />
            <InputNumber
              name="Velocidade"
              value={clip.speed}
              step={0.1}
              onChange={v => onEditClip(clip.id, {speed: clamp(v, 0.25, 4)})}
            />
          </div>
          <div className="duo">
            <InputNumber
              name="Zoom"
              value={clip.zoom ?? 1}
              step={0.05}
              onChange={v => onEditClip(clip.id, {zoom: clamp(v, 0.6, 4)})}
            />
            <InputNumber
              name="X %"
              value={clip.x ?? 50}
              onChange={v => onEditClip(clip.id, {x: v})}
            />
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={!!clip.muted}
              onChange={e => onEditClip(clip.id, {muted: e.target.checked})}
            />{' '}
            Silenciar este trecho
          </label>
          <button onClick={onSplitClip}>✂ Dividir no playhead</button>
          <button onClick={onFaceReframe}>◉ Reframe por rosto (experimental)</button>
          <button onClick={onAutoZoom}>⚡ Zooms automáticos pelas legendas</button>
          <button onClick={onCutSilences} disabled={!!renderJob}>
            ✂ Cortar silêncios (FFmpeg)
          </button>
        </>
      )}

      {selected && selected.kind !== 'word' && (
        <>
          <div className="sectionLine">KEYFRAMES</div>
          <label className="check">
            <input
              type="checkbox"
              checked={keyframeMode}
              onChange={e => onSetKeyframeMode(e.target.checked)}
            />{' '}
            Reposicionar criando keyframes
          </label>
          <button onClick={onAddKeyframe}>+ Keyframe em {seconds(cursor)}</button>
          <small>
            {(cue?.keyframes || overlay?.keyframes || clip?.keyframes || []).length} pontos ·
            interpolações suaves entre pontos
          </small>
        </>
      )}

      <div className="buttonRow">
        <button onClick={onDuplicate} disabled={!selected}>
          Duplicar
        </button>
        <button className="delete" onClick={onDeleteSelection} disabled={!selected}>
          Excluir seleção
        </button>
      </div>
    </div>
  );
};
