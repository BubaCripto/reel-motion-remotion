import React,{useEffect,useState} from 'react';
import type {ReelProject} from '../../lib/project';
import {rhythmSignature,transcriptOf,type RhythmAnalysis,type RhythmType} from '../../lib/rhythm';
import './rhythm.css';

export const rhythmLabels:Record<RhythmType,string>={pause:'Corte de pausa','jump-cut':'Jump cut','punch-in':'Zoom / punch-in',reframe:'Enquadramento',broll:'Ponto de B-roll',cta:'CTA final',hook:'Texto de gancho'};
const level=(score:number)=>score>=70?'good':score>=40?'medium':'risk';
const at=(seconds:number)=>seconds.toFixed(2)+' s';
type Props={project:ReelProject;busy:boolean;versions:ReelProject[];focusId?:string;onAnalyze:(objective:string)=>void;onApply:(id:string)=>void;onDismiss:(id:string)=>void;onCreateVariants:()=>void;onChooseVersion:(project:ReelProject)=>void;onSeek:(time:number)=>void};

export function RhythmPanel({project,busy,versions,focusId,onAnalyze,onApply,onDismiss,onCreateVariants,onChooseVersion,onSeek}:Props){
 const analysis=project.editorial;
 const [objective,setObjective]=useState(analysis?.objective||'Ensinar algo útil e incentivar a pessoa a salvar o Reel.');
 const [filter,setFilter]=useState<'all'|RhythmType>('all');
 useEffect(()=>{setObjective(project.editorial?.objective||'Ensinar algo útil e incentivar a pessoa a salvar o Reel.');},[project.id]);
 useEffect(()=>{if(focusId){setFilter('all');requestAnimationFrame(()=>document.getElementById('rhythm-'+focusId)?.scrollIntoView({block:'nearest'}));}},[focusId]);
 const stale=!!analysis&&(analysis.signature!==rhythmSignature(project)||analysis.objective!==objective.trim());
 const canAnalyze=project.clips.length>0&&transcriptOf(project).length>0&&!!objective.trim();
 const suggestions=analysis?.suggestions.filter(s=>filter==='all'||s.type===filter)||[];
 return <div className="fields rhythmPanel">
  <h3>EDITOR DE RITMO</h3><p>Analise o gancho dos primeiros 3 segundos e escolha as melhorias que deseja aplicar.</p>
  <label>Objetivo do Reel<textarea rows={3} value={objective} maxLength={1500} onChange={event=>setObjective(event.target.value)}/></label>
  <button className="accentBtn" disabled={busy||!canAnalyze} onClick={()=>onAnalyze(objective.trim())}>{busy?'Analisando…':'✦ Analisar ritmo · Gemini'}</button>
  {!canAnalyze&&<p className="help">Importe um vídeo e gere ou importe as legendas da fala para começar.</p>}
  <p className="help">As pontuações são estimativas editoriais, não uma medição de retenção real. A análise usa a transcrição e o áudio inicial quando disponível.</p>
  {analysis&&<>
   {stale&&<p className="rhythmWarning" role="status">A timeline ou o objetivo mudou. Analise novamente para atualizar as sugestões.</p>}
   <section className={`hookScore ${level(analysis.hook.score)}`}><div><strong>{analysis.hook.score}<small>/100</small></strong><span>Gancho · primeiros 3 s</span></div><p>{analysis.hook.summary}</p>{analysis.hook.issues.length>0&&<ul>{analysis.hook.issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul>}</section>
   <p className="help">{analysis.audio.note}</p><div className="sectionLine">SUGESTÕES NA TIMELINE</div>
   <label>Filtrar<select value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option value="all">Todas ({analysis.suggestions.length})</option>{Object.entries(rhythmLabels).map(([type,label])=><option key={type} value={type}>{label}</option>)}</select></label>
   {suggestions.length===0&&<p className="help">Nenhuma sugestão para este filtro.</p>}
   {suggestions.map(s=><article id={'rhythm-'+s.id} className={`rhythmSuggestion ${s.status} ${focusId===s.id?'focused':''}`} key={s.id}><small>{rhythmLabels[s.type]} · {at(s.start)}–{at(s.end)}</small><strong>{s.title}</strong><p>{s.reason}</p>{s.text&&<blockquote>{s.text}</blockquote>}<div className="buttonRow"><button onClick={()=>onSeek(s.start)}>Ver trecho</button>{s.status==='pending'?<><button disabled={busy||stale} onClick={()=>onApply(s.id)}>{s.type==='broll'?'Marcar B-roll':'Aplicar'}</button><button disabled={busy} onClick={()=>onDismiss(s.id)}>Ignorar</button></>:<span>{s.status==='applied'?(s.type==='broll'?'Ponto marcado · importe sua mídia':'Aplicada'):'Ignorada'}</span>}</div></article>)}
   <div className="sectionLine">ABERTURAS A/B</div><p>Crie duas cópias completas do projeto com título de abertura, zoom e CTA diferentes. O áudio original é mantido.</p>
   {analysis.openings.map(o=><article className="rhythmOpening" key={o.label}><strong>Versão {o.label} · {at(o.duration)}</strong><p>{o.hookText}</p><small>{o.reason}</small><p>CTA: {o.ctaText}</p>{o.leadTrim>0&&<small>Remove {at(o.leadTrim)} de silêncio inicial confirmado.</small>}</article>)}
   <button disabled={busy||stale||analysis.openings.length!==2} onClick={onCreateVariants}>Criar cópias A/B na biblioteca</button>
  </>}
  {versions.length>0&&<><div className="sectionLine">ESCOLHER VERSÃO PRINCIPAL</div>{versions.map(version=><div className="rhythmVersion" key={version.id}><strong>{version.rhythmVariant?.label}</strong><span>{version.rhythmVariant?.primary?'Principal':version.name}</span><button disabled={busy} onClick={()=>onChooseVersion(version)}>{project.id===version.id?'Versão atual':'Usar e editar'}</button></div>)}<p className="help">A versão atual é a usada na exportação MP4. Todas as cópias ficam na Biblioteca e continuam editáveis.</p></>}
 </div>;
}

export function RhythmMarkers({analysis,zoom,width,onSeek,onSuggestion}:{analysis:RhythmAnalysis;zoom:number;width:number;onSeek:(time:number)=>void;onSuggestion:(id:string)=>void}){
 const rows:number[]=[];
 const placed=analysis.suggestions.filter(s=>s.status!=='dismissed').sort((a,b)=>a.start-b.start).map(s=>{let row=rows.findIndex(end=>end<s.start*zoom);if(row<0)row=rows.length;rows[row]=s.start*zoom+150;return {s,row};});
 return <>
  <div className="trackRow rhythmTrack"><div className="trackLabel">◉ RETENÇÃO ESTIMADA</div><div className="trackCanvas" style={{width}}>{analysis.segments.map((segment,index)=><button key={index} className={`rhythmSegment ${level(segment.score)}`} style={{left:segment.start*zoom,width:Math.max(14,(segment.end-segment.start)*zoom)}} title={`${segment.score}/100 · ${segment.reason}`} onClick={()=>onSeek(segment.start)} aria-label={`Trecho ${at(segment.start)}: score ${segment.score}. ${segment.reason}`}>{segment.score} · {segment.reason}</button>)}</div></div>
  <div className="trackRow rhythmTrack"><div className="trackLabel">✦ SUGESTÕES DE RITMO</div><div className="trackCanvas" style={{width,height:Math.max(39,rows.length*34+5)}}>{placed.map(({s,row})=><button key={s.id} className={`rhythmMarker ${s.status}`} style={{left:s.start*zoom,top:5+row*34}} title={`${rhythmLabels[s.type]} · ${s.title}: ${s.reason}`} onClick={()=>{onSeek(s.start);onSuggestion(s.id);}} aria-label={`${rhythmLabels[s.type]} em ${at(s.start)}: ${s.title}`}>{s.status==='applied'?'✓':'✦'} {rhythmLabels[s.type]}</button>)}</div></div>
 </>;
}
