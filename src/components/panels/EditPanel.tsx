import React from 'react';
import type {Cue,Keyframe,Overlay,Preset,ReelProject,VideoClip,Word} from '../../lib/project';
import {clamp,isTranscript,splitWords,seconds} from '../../lib/project';
import {InputNumber,colorField} from '../common/InputNumber';
import {categories,labelName,type Selection} from '../../types/editor';

type MotionTextField = {key: 'label'|'metric'|'subtext'|'coordinates'|'speedText'|'text'; label: string; placeholder: string; multiline?: boolean};
const sceneTextFields = (scene: string): MotionTextField[] => {
  switch (scene) {
    case 'comparison': return [{key:'label',label:'Texto do lado esquerdo',placeholder:'Ex.: ANTES'},{key:'metric',label:'Texto do lado direito',placeholder:'Ex.: DEPOIS'},{key:'subtext',label:'Texto de apoio',placeholder:'Ex.: o que mudou?'}];
    case 'checklist': return [{key:'label',label:'Título do checklist',placeholder:'Ex.: 3 PASSOS'},{key:'subtext',label:'Itens (separe com |)',placeholder:'GANCHO FORTE|CORTE RÁPIDO|CTA CLARO',multiline:true}];
    case 'timeline-steps': return [{key:'label',label:'Título da linha do tempo',placeholder:'Ex.: PLANO DE AÇÃO'},{key:'subtext',label:'Etapas (separe com |)',placeholder:'COMEÇAR|AJUSTAR|CRESCER',multiline:true}];
    case 'social-profile': return [{key:'label',label:'Nome do perfil',placeholder:'Ex.: SUA MARCA'},{key:'subtext',label:'@usuário / descrição',placeholder:'@seuperfil'},{key:'metric',label:'Seguidores / prova social',placeholder:'Ex.: 10K'}];
    case 'social-cta': return [{key:'label',label:'Chamada para ação',placeholder:'Ex.: SALVE ESTE REEL'},{key:'subtext',label:'Texto de apoio',placeholder:'Ex.: PARA VER DE NOVO'}];
    case 'social-comment': return [{key:'label',label:'Texto do comentário',placeholder:'Ex.: DEIXE UM COMENTÁRIO'},{key:'subtext',label:'Pergunta / apoio',placeholder:'Ex.: QUAL A SUA DÚVIDA?'}];
    case 'social-notification': return [{key:'label',label:'Título da notificação',placeholder:'Ex.: NOVO SEGUIDOR'},{key:'subtext',label:'Mensagem da notificação',placeholder:'Ex.: veja agora'}];
    case 'target-lock': return [{key:'label',label:'Rótulo de foco',placeholder:'Ex.: FOCO PRINCIPAL'},{key:'coordinates',label:'Coordenadas / detalhe HUD',placeholder:'Ex.: HUD [4K] TARGET'}];
    case 'speed-gauge': return [{key:'label',label:'Rótulo',placeholder:'Ex.: ACELERAÇÃO'},{key:'speedText',label:'Velocidade / métrica',placeholder:'Ex.: 10X'}];
    case 'stamp-impact': return [{key:'text',label:'Texto do carimbo',placeholder:'Ex.: NÃO FAÇA ISSO'},{key:'subtext',label:'Texto de apoio',placeholder:'Ex.: ERRO GRAVE'}];
    case 'search-bar': return [{key:'label',label:'Texto da busca',placeholder:'Ex.: PESQUISE ISTO'}];
    case 'cursor-click': return [{key:'label',label:'Texto do botão',placeholder:'Ex.: CLIQUE AQUI'}];
    case 'metric-counter': return [{key:'label',label:'Rótulo da métrica',placeholder:'Ex.: RESULTADO'},{key:'metric',label:'Número / percentual',placeholder:'Ex.: +340%'},{key:'subtext',label:'Texto de apoio',placeholder:'Ex.: EM POUCOS PASSOS'}];
    default: return [{key:'label',label:'Rótulo / título',placeholder:'Texto principal'},{key:'metric',label:'Métrica / detalhe',placeholder:'Ex.: +340% ou texto auxiliar'},{key:'subtext',label:'Texto complementar',placeholder:'Opcional'}];
  }
};

const SFX_OPTIONS = [
  {file: 'whoosh-fast.wav', label: 'Whoosh rápido'},
  {file: 'whoosh-cinematic.wav', label: 'Whoosh cinematográfico'},
  {file: 'impact-boom.wav', label: 'Impacto / boom'},
  {file: 'pop-clean.wav', label: 'Pop limpo'},
  {file: 'camera-click.wav', label: 'Clique de câmera'},
  {file: 'vinyl-scratch.wav', label: 'Vinil / scratch'},
  {file: 'coin-ding.wav', label: 'Moeda / ding'},
  {file: 'riser-speed.wav', label: 'Riser de velocidade'}
] as const;
const builtInSfxFile = (src?: string) => src?.match(/^\/sfx\/([a-z0-9-]+\.wav)$/i)?.[1] ?? null;

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
              <label className="check" style={{background: 'rgba(232,189,85,0.08)', padding: '7px 10px', borderRadius: 7, margin: '10px 0', border: '1px solid #755d30'}}>
                <input
                  type="checkbox"
                  checked={!!cue.karaoke}
                  onChange={e => onEditCue(cue.id, {karaoke: e.target.checked})}
                />
                <strong style={{color: '#f6d780'}}>🎤 Karaokê Dinâmico (OpusClip / Hormozi)</strong>
              </label>
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
          <div
            className="panelTag"
            style={
              overlay.kind === 'motion'
                ? {
                    background: 'rgba(124, 58, 237, 0.22)',
                    borderColor: '#a855f7',
                    color: '#f472b6',
                    fontWeight: 800
                  }
                : undefined
            }
          >
            {overlay.kind === 'motion' ? `⚡ Motion Graphics · ${overlay.motionType || 'Cena'}` : `Camada independente · ${overlay.kind}`}
          </div>
          {overlay.kind === 'audio' && builtInSfxFile(overlay.src) ? (
            <label>
              Efeito sonoro
              <select
                value={builtInSfxFile(overlay.src) || ''}
                onChange={e => {
                  const option = SFX_OPTIONS.find(item => item.file === e.target.value);
                  if (!option) return;
                  onEditLayer(overlay.id, {src: `/sfx/${option.file}`, name: `SFX — ${option.label}`});
                }}
              >
                {SFX_OPTIONS.map(option => <option key={option.file} value={option.file}>{option.label}</option>)}
              </select>
            </label>
          ) : (
            <label>
              Nome
              <input
                value={overlay.name}
                onChange={e => onEditLayer(overlay.id, {name: e.target.value})}
              />
            </label>
          )}

          {overlay.kind === 'motion' && (
            <div
              style={{
                background: '#1c1b27',
                border: '1px solid #48386b',
                borderRadius: 8,
                padding: '12px 14px',
                margin: '12px 0 16px'
              }}
            >
              <label>
                Tipo de Motion
                <select
                  value={overlay.motionType || 'kinetic-text'}
                  onChange={e => {
                    const mt = e.target.value as any;
                    onEditLayer(overlay.id, {
                      motionType: mt,
                      name: `Motion ${mt}`,
                      motionProps:
                        mt === 'scene'
                          ? {scene: 'growth-graph', label: 'CRESCIMENTO', metric: '+340%'}
                          : mt === 'kinetic-text'
                          ? {style: '3d-tilt', outline: true, backdropWord: 'FOCO'}
                          : mt === 'stroke-path'
                          ? {shape: 'curved-arrow', strokeWidth: 10, angle: -30}
                          : mt === 'burst'
                          ? {shape: 'spark', count: 16}
                          : mt === 'speed-lines'
                          ? {count: 24, intensity: 1}
                          : {intensity: 16, decayFrames: 10}
                    });
                  }}
                >
                  <option value="scene">📈 Cena Semântica (Gráfico, Mira, Foguete...)</option>
                  <option value="kinetic-text">🔤 Tipografia Cinética (3D, Stagger, Elastic)</option>
                  <option value="stroke-path">✏️ Traço Vetorial (Seta, Círculo, Sublinhado)</option>
                  <option value="burst">✨ Explosão de Partículas (Bursts)</option>
                  <option value="speed-lines">⚡ Linhas de Ação / Speed Lines</option>
                  <option value="camera-shake">📳 Tremor Sísmico de Câmera</option>
                </select>
              </label>

              {overlay.motionType === 'scene' && (
                <>
                  <label>
                    Cena Vetorial
                    <select
                      value={overlay.motionProps?.scene || 'growth-graph'}
                      onChange={e =>
                        onEditLayer(overlay.id, {
                          motionProps: {...(overlay.motionProps || {}), scene: e.target.value}
                        })
                      }
                    >
                      <option value="growth-graph">📈 Gráfico Neon de Crescimento</option>
                      <option value="target-lock">🎯 Mira Óptica HUD com Coordenadas</option>
                      <option value="rocket-launch">🚀 Foguete Vetorial com Propulsão</option>
                      <option value="stamp-impact">💥 Carimbo Giratório de Impacto</option>
                      <option value="hazard-warning">⚠️ Faixas Zebradas de Alerta</option>
                      <option value="hourglass">⏳ Ampulheta Geométrica com Areia</option>
                      <option value="speed-gauge">⚡ Velocímetro no Limite Vermelho</option>
                      <option value="neural-brain">🧠 Rede Neural com Pulsos de Luz</option>
                      <option value="social-cta">♥ CTA social: curtir, salvar e seguir</option>
                      <option value="social-comment">💬 Comentário / DM em destaque</option>
                      <option value="metric-counter"># Contador de métrica / percentual</option>
                      <option value="comparison">⇄ Comparação: antes × depois</option>
                      <option value="checklist">✓ Checklist animado</option>
                      <option value="progress-bar">▰ Barra de progresso</option>
                      <option value="focus-spotlight">⌕ Foco / lupa / destaque</option>
                      <option value="calendar-clock">⏱ Calendário / prazo / relógio</option>
                      <option value="social-notification">🔔 Notificação social</option>
                      <option value="social-profile">◉ Card de perfil social</option>
                      <option value="search-bar">⌕ Barra de busca animada</option>
                      <option value="cursor-click">➤ Cursor / clique guiado</option>
                      <option value="glitch-rgb">▧ Glitch RGB</option>
                      <option value="impact-flash">✦ Flash de impacto</option>
                      <option value="crt-vhs">▤ CRT / VHS retrô</option>
                      <option value="confetti">🎉 Confete de conquista</option>
                      <option value="bar-chart">▥ Gráfico de barras</option>
                      <option value="conversion-funnel">▽ Funil de conversão</option>
                      <option value="ranking-podium">♛ Ranking / pódio</option>
                      <option value="timeline-steps">— Linha do tempo</option>
                      <option value="radar-scan">◉ Radar / mapa</option>
                      <option value="domino-effect">▯ Efeito dominó</option>
                      <option value="traffic-light">● Semáforo</option>
                      <option value="balance-scale">⚖ Balança / escolha</option>
                    </select>
                  </label>
                  {sceneTextFields(String(overlay.motionProps?.scene || 'growth-graph')).map(field => {
                    const value = String(overlay.motionProps?.[field.key] ?? (field.key === 'label' ? overlay.text ?? '' : ''));
                    const update = (next: string) => onEditLayer(overlay.id, {
                      ...(field.key === 'label' || field.key === 'text' ? {text: next} : {}),
                      motionProps: {...(overlay.motionProps || {}), [field.key]: next}
                    });
                    return <label key={field.key}>
                      {field.label}
                      {field.multiline ? <textarea rows={2} value={value} placeholder={field.placeholder} onChange={e => update(e.target.value)} /> : <input value={value} placeholder={field.placeholder} onChange={e => update(e.target.value)} />}
                    </label>;
                  })}
                </>
              )}

              {overlay.motionType === 'kinetic-text' && (
                <>
                  <label>
                    Texto Cinético
                    <textarea
                      rows={2}
                      value={overlay.text ?? overlay.motionProps?.text ?? ''}
                      onChange={e =>
                        onEditLayer(overlay.id, {
                          text: e.target.value,
                          motionProps: {...(overlay.motionProps || {}), text: e.target.value}
                        })
                      }
                    />
                  </label>
                  <label>
                    Estilo de Animação
                    <select
                      value={overlay.motionProps?.style || '3d-tilt'}
                      onChange={e =>
                        onEditLayer(overlay.id, {
                          motionProps: {...(overlay.motionProps || {}), style: e.target.value}
                        })
                      }
                    >
                      <option value="3d-tilt">Rotação 3D com Perspectiva e Tilt</option>
                      <option value="elastic-bounce">Mola Elástica (Elastic Bounce)</option>
                      <option value="stagger-burst">Cascata de Letras (Stagger Delay)</option>
                      <option value="stretch-squash">Esticar e Esmagar (Squash & Stretch)</option>
                      <option value="backdrop-outline">Texto Gigante Vazado</option>
                    </select>
                  </label>
                  <label>
                    Palavra de Fundo (Backdrop Word)
                    <input
                      value={overlay.motionProps?.backdropWord ?? ''}
                      placeholder="Ex: STOP, 10X, AGORA..."
                      onChange={e =>
                        onEditLayer(overlay.id, {
                          motionProps: {...(overlay.motionProps || {}), backdropWord: e.target.value}
                        })
                      }
                    />
                  </label>
                  <label className="check" style={{marginTop: 8}}>
                    <input
                      type="checkbox"
                      checked={overlay.motionProps?.outline ?? true}
                      onChange={e =>
                        onEditLayer(overlay.id, {
                          motionProps: {...(overlay.motionProps || {}), outline: e.target.checked}
                        })
                      }
                    />
                    Borda / Outline Vazada
                  </label>
                </>
              )}

              {overlay.motionType === 'stroke-path' && (
                <>
                  <label>
                    Formato do Traço (Trim Path)
                    <select
                      value={overlay.motionProps?.shape || overlay.type || 'curved-arrow'}
                      onChange={e =>
                        onEditLayer(overlay.id, {
                          type: e.target.value as any,
                          motionProps: {...(overlay.motionProps || {}), shape: e.target.value}
                        })
                      }
                    >
                      <option value="curved-arrow">↗ Seta Orgânica Curva</option>
                      <option value="scribble-circle">⭕ Círculo Rabiscado Vivo</option>
                      <option value="marker-underline">✏️ Marcador de Texto Sublinhado</option>
                      <option value="target-reticle">🎯 Retículo de Foco Óptico</option>
                      <option value="spiral-draw">🌀 Espiral Dinâmica</option>
                    </select>
                  </label>
                  <InputNumber
                    name="Espessura do Traço"
                    value={overlay.strokeWidth ?? overlay.motionProps?.strokeWidth ?? 10}
                    onChange={v =>
                      onEditLayer(overlay.id, {
                        strokeWidth: v,
                        motionProps: {...(overlay.motionProps || {}), strokeWidth: v}
                      })
                    }
                  />
                  <InputNumber
                    name="Ângulo de Rotação °"
                    value={overlay.rotation ?? overlay.motionProps?.angle ?? 0}
                    onChange={v =>
                      onEditLayer(overlay.id, {
                        rotation: v,
                        motionProps: {...(overlay.motionProps || {}), angle: v}
                      })
                    }
                  />
                </>
              )}

              {overlay.motionType === 'burst' && (
                <>
                  <label>
                    Forma das Partículas
                    <select
                      value={overlay.motionProps?.shape || 'spark'}
                      onChange={e =>
                        onEditLayer(overlay.id, {
                          motionProps: {...(overlay.motionProps || {}), shape: e.target.value}
                        })
                      }
                    >
                      <option value="spark">Faíscas Radiantes (Sparks)</option>
                      <option value="star">Estrelas Geométricas (Stars)</option>
                      <option value="diamond">Losangos / Diamantes</option>
                    </select>
                  </label>
                  <InputNumber
                    name="Quantidade de Partículas"
                    value={overlay.motionProps?.count ?? 16}
                    onChange={v =>
                      onEditLayer(overlay.id, {
                        motionProps: {
                          ...(overlay.motionProps || {}),
                          count: Math.max(4, Math.min(48, Math.round(v)))
                        }
                      })
                    }
                  />
                </>
              )}

              {overlay.motionType === 'speed-lines' && (
                <InputNumber
                  name="Intensidade das Linhas"
                  value={overlay.motionProps?.intensity ?? 1}
                  onChange={v =>
                    onEditLayer(overlay.id, {
                      motionProps: {...(overlay.motionProps || {}), intensity: clamp(v, 0.2, 3)}
                    })
                  }
                />
              )}

              <label className="check" style={{marginTop: 8}}>
                <input
                  type="checkbox"
                  checked={!!overlay.motionProps?.cameraShake}
                  onChange={e =>
                    onEditLayer(overlay.id, {
                      motionProps: {...(overlay.motionProps || {}), cameraShake: e.target.checked}
                    })
                  }
                />
                📳 Tremor Sísmico de Câmera no Impacto
              </label>
            </div>
          )}
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
          {overlay.kind !== 'audio' && overlay.kind !== 'video' &&
            colorField('Cor', overlay.color ?? '#ffffff', v => onEditLayer(overlay.id, {color: v}))}
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
          {overlay.kind !== 'audio' && (
            <>
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
            </>
          )}
          {overlay.kind === 'audio' && (
            <div
              style={{
                background: '#191b24',
                border: '1px solid #3d3b54',
                borderRadius: 8,
                padding: '14px 16px',
                margin: '14px 0 16px'
              }}
            >
              <div className="sectionLine" style={{marginTop: 0}}>🎚️ MIXER DE ÁUDIO · TRILHA</div>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                <span style={{fontSize: 13, fontWeight: 700, color: '#e8bb54'}}>
                  {overlay.muted || (overlay.volume ?? 1) === 0
                    ? '🔇 Mudo (0%)'
                    : `🔊 Volume: ${Math.round(clamp(overlay.volume ?? 1, 0, 1) * 100)}%`}
                </span>
                <button
                  type="button"
                  style={{
                    width: 'auto',
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    background: overlay.muted ? '#64282e' : '#2b303c',
                    borderColor: overlay.muted ? '#ff6663' : '#454a58',
                    color: overlay.muted ? '#ffb6b8' : '#e8e8ee'
                  }}
                  onClick={() => onEditLayer(overlay.id, {muted: !overlay.muted})}
                >
                  {overlay.muted ? '🔊 Desmutar' : '🔇 Silenciar'}
                </button>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={overlay.muted ? 0 : Math.round(clamp(overlay.volume ?? 1, 0, 1) * 100)}
                onChange={e => {
                  const pct = Number(e.target.value);
                  onEditLayer(overlay.id, {
                    volume: pct / 100,
                    muted: pct === 0
                  });
                }}
              />

              <div style={{display: 'flex', gap: 6, marginTop: 10}}>
                {[0, 25, 50, 75, 100].map(pct => {
                  const isActive =
                    (!overlay.muted && Math.round((overlay.volume ?? 1) * 100) === pct) ||
                    (overlay.muted && pct === 0);
                  return (
                    <button
                      key={pct}
                      type="button"
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        fontSize: 11,
                        fontWeight: isActive ? 800 : 500,
                        background: isActive ? '#4a3b22' : '#222530',
                        borderColor: isActive ? '#e8bb54' : '#393d4a',
                        color: isActive ? '#f6d780' : '#aaa'
                      }}
                      onClick={() => onEditLayer(overlay.id, {volume: pct / 100, muted: pct === 0})}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>

              <div style={{marginTop: 16, borderTop: '1px solid #2f3242', paddingTop: 12}}>
                <label className="check" style={{marginBottom: 8}}>
                  <input
                    type="checkbox"
                    checked={overlay.ducking !== false}
                    onChange={e => onEditLayer(overlay.id, {ducking: e.target.checked})}
                  />
                  <span>🎙️ <strong>Auto-Ducking Inteligente</strong></span>
                </label>
                <p className="help" style={{margin: '4px 0 10px', fontSize: 11}}>
                  Reduz o volume da música automaticamente enquanto houver falas ou legendas ativas no vídeo.
                </p>
                {overlay.ducking !== false && (
                  <div style={{background: '#14161f', padding: '10px 12px', borderRadius: 6, border: '1px solid #2a2d3d'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                      <span style={{fontSize: 11, color: '#c4c6ce'}}>Volume durante a fala</span>
                      <strong style={{color: '#e8bb54', fontSize: 12}}>{Math.round((overlay.duckingAmount ?? 0.28) * 100)}%</strong>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="1"
                      value={Math.round((overlay.duckingAmount ?? 0.28) * 100)}
                      onChange={e => onEditLayer(overlay.id, {duckingAmount: Number(e.target.value) / 100})}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {overlay.kind === 'video' && (
            <div
              style={{
                background: '#191b24',
                border: '1px solid #3d3b54',
                borderRadius: 8,
                padding: '14px 16px',
                margin: '14px 0 16px'
              }}
            >
              <div className="sectionLine" style={{marginTop: 0}}>🎚️ ÁUDIO DO B-ROLL</div>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                <span style={{fontSize: 13, fontWeight: 700, color: '#e8bb54'}}>
                  {overlay.muted || (overlay.volume ?? 1) === 0
                    ? '🔇 B-Roll Mudo (0%)'
                    : `🔊 Volume: ${Math.round(clamp(overlay.volume ?? 1, 0, 1) * 100)}%`}
                </span>
                <button
                  type="button"
                  style={{
                    width: 'auto',
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    background: overlay.muted ? '#64282e' : '#2b303c',
                    borderColor: overlay.muted ? '#ff6663' : '#454a58',
                    color: overlay.muted ? '#ffb6b8' : '#e8e8ee'
                  }}
                  onClick={() => onEditLayer(overlay.id, {muted: !overlay.muted})}
                >
                  {overlay.muted ? '🔊 Desmutar' : '🔇 Silenciar'}
                </button>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={overlay.muted ? 0 : Math.round(clamp(overlay.volume ?? 1, 0, 1) * 100)}
                onChange={e => {
                  const pct = Number(e.target.value);
                  onEditLayer(overlay.id, {
                    volume: pct / 100,
                    muted: pct === 0
                  });
                }}
              />

              <div style={{display: 'flex', gap: 6, marginTop: 10}}>
                {[0, 25, 50, 75, 100].map(pct => {
                  const isActive =
                    (!overlay.muted && Math.round((overlay.volume ?? 1) * 100) === pct) ||
                    (overlay.muted && pct === 0);
                  return (
                    <button
                      key={pct}
                      type="button"
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        fontSize: 11,
                        fontWeight: isActive ? 800 : 500,
                        background: isActive ? '#4a3b22' : '#222530',
                        borderColor: isActive ? '#e8bb54' : '#393d4a',
                        color: isActive ? '#f6d780' : '#aaa'
                      }}
                      onClick={() => onEditLayer(overlay.id, {volume: pct / 100, muted: pct === 0})}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>
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
          <div
            style={{
              background: '#191b24',
              border: '1px solid #3d3b54',
              borderRadius: 8,
              padding: '14px 16px',
              margin: '12px 0 16px'
            }}
          >
            <div className="sectionLine" style={{marginTop: 0}}>🎚️ ÁUDIO DO CLIPE DE VÍDEO</div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
              <span style={{fontSize: 13, fontWeight: 700, color: '#e8bb54'}}>
                {clip.muted || (clip.volume ?? 1) === 0
                  ? '🔇 Mudo (0%)'
                  : `🔊 Volume: ${Math.round(clamp(clip.volume ?? 1, 0, 1) * 100)}%`}
              </span>
              <button
                type="button"
                style={{
                  width: 'auto',
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  background: clip.muted ? '#64282e' : '#2b303c',
                  borderColor: clip.muted ? '#ff6663' : '#454a58',
                  color: clip.muted ? '#ffb6b8' : '#e8e8ee'
                }}
                onClick={() => onEditClip(clip.id, {muted: !clip.muted})}
              >
                {clip.muted ? '🔊 Desmutar' : '🔇 Silenciar'}
              </button>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={clip.muted ? 0 : Math.round(clamp(clip.volume ?? 1, 0, 1) * 100)}
              onChange={e => {
                const pct = Number(e.target.value);
                onEditClip(clip.id, {
                  volume: pct / 100,
                  muted: pct === 0
                });
              }}
            />

            <div style={{display: 'flex', gap: 6, marginTop: 10}}>
              {[0, 25, 50, 75, 100].map(pct => {
                const isActive =
                  (!clip.muted && Math.round((clip.volume ?? 1) * 100) === pct) ||
                  (clip.muted && pct === 0);
                return (
                  <button
                    key={pct}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: 11,
                      fontWeight: isActive ? 800 : 500,
                      background: isActive ? '#4a3b22' : '#222530',
                      borderColor: isActive ? '#e8bb54' : '#393d4a',
                      color: isActive ? '#f6d780' : '#aaa'
                    }}
                    onClick={() => onEditClip(clip.id, {volume: pct / 100, muted: pct === 0})}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          </div>
          <div className="sectionLine">TRANSIÇÃO DE ENTRADA</div>
          <label>
            Tipo de transição
            <select
              value={clip.transition?.type ?? 'none'}
              onChange={e =>
                onEditClip(clip.id, {
                  transition: {
                    type: e.target.value as any,
                    duration: clip.transition?.duration ?? 0.35
                  }
                })
              }
            >
              <option value="none">Corte Seco (Nenhuma)</option>
              <option value="crossfade">Cross Dissolve (Fusão)</option>
              <option value="zoom-in">Zoom In (Aproximação)</option>
              <option value="zoom-out">Zoom Out (Afastamento)</option>
              <option value="whip-right">Whip Pan → (Chicote Direita)</option>
              <option value="whip-left">← Whip Pan (Chicote Esquerda)</option>
              <option value="flash">White Flash (Flash Branco)</option>
            </select>
          </label>
          {clip.transition?.type && clip.transition.type !== 'none' && (
            <InputNumber
              name="Duração da transição (s)"
              value={clip.transition?.duration ?? 0.35}
              min={0.1}
              max={1.5}
              step={0.05}
              onChange={v =>
                onEditClip(clip.id, {
                  transition: {
                    type: clip.transition?.type ?? 'crossfade',
                    duration: clamp(v, 0.1, 1.5)
                  }
                })
              }
            />
          )}
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
