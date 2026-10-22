import React from 'react';
import {formatTimecode} from '../../types/editor';

export type AiCutItem = {
  id: string;
  start: number;
  end: number;
  reason: string;
  selected: boolean;
};

export type AiReviewSession = {
  cuts: AiCutItem[];
  rewrites: [string, string][];
  summary: string;
  originalDuration: number;
};

type Props = {
  session: AiReviewSession | null;
  fps: number;
  onToggleCut: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
  onApply: () => void;
  onCancel: () => void;
};

export const AiReviewModal: React.FC<Props> = ({
  session,
  fps,
  onToggleCut,
  onToggleAll,
  onApply,
  onCancel
}) => {
  if (!session) return null;

  const selectedCuts = session.cuts.filter(c => c.selected);
  const totalSavedSec = selectedCuts.reduce((acc, c) => acc + (c.end - c.start), 0);
  const estimatedNewDuration = Math.max(0, session.originalDuration - totalSavedSec);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#191a20',
          border: '1px solid #eab308',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(234, 179, 8, 0.2)',
          borderRadius: 12,
          width: 'min(580px, 100%)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #363741',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{margin: 0, color: '#f6d780', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8}}>
              <span>✦</span> Revisão de Cortes da IA (Gemini)
            </h3>
            <small style={{color: '#9e9fa9', fontSize: 11}}>
              Revise e selecione os trechos que deseja remover antes de aplicar permanentemente
            </small>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#a4a7b1',
              fontSize: 18,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Overview Stats */}
        <div
          style={{
            padding: '12px 20px',
            background: '#23252e',
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #33343c'
          }}
        >
          <div>
            <div style={{color: '#9e9fa9', fontSize: 11}}>Duração Atual</div>
            <strong style={{color: '#fff', fontSize: 14}}>{session.originalDuration.toFixed(1)}s</strong>
          </div>
          <div style={{color: '#eab308', fontSize: 18}}>➔</div>
          <div>
            <div style={{color: '#9e9fa9', fontSize: 11}}>Duração Prevista</div>
            <strong style={{color: '#22d3ee', fontSize: 14}}>{estimatedNewDuration.toFixed(1)}s</strong>
          </div>
          <div>
            <div style={{color: '#9e9fa9', fontSize: 11}}>Tempo Economizado</div>
            <strong style={{color: '#4ade80', fontSize: 14}}>
              -{totalSavedSec.toFixed(1)}s ({((totalSavedSec / (session.originalDuration || 1)) * 100).toFixed(0)}%)
            </strong>
          </div>
        </div>

        {/* Cuts List */}
        <div style={{flex: 1, overflowY: 'auto', padding: '14px 20px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
            <span style={{fontSize: 12, color: '#c4c6ce', fontWeight: 600}}>
              {session.cuts.length} cortes sugeridos ({selectedCuts.length} marcados)
            </span>
            <div style={{display: 'flex', gap: 8}}>
              <button
                type="button"
                style={{fontSize: 11, padding: '4px 8px'}}
                onClick={() => onToggleAll(true)}
              >
                Marcar todos
              </button>
              <button
                type="button"
                style={{fontSize: 11, padding: '4px 8px'}}
                onClick={() => onToggleAll(false)}
              >
                Desmarcar todos
              </button>
            </div>
          </div>

          {session.cuts.map(cut => (
            <label
              key={cut.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                background: cut.selected ? 'rgba(234, 179, 8, 0.08)' : '#202129',
                border: cut.selected ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid #343741',
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="checkbox"
                checked={cut.selected}
                onChange={() => onToggleCut(cut.id)}
                style={{marginTop: 3, accentColor: '#eab308'}}
              />
              <div style={{flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4}}>
                  <strong style={{color: '#facc15', fontSize: 12}}>
                    ✂ {formatTimecode(cut.start, fps)} ➔ {formatTimecode(cut.end, fps)}
                  </strong>
                  <span style={{color: '#ef4444', fontSize: 11, fontWeight: 700}}>
                    -{(cut.end - cut.start).toFixed(2)}s
                  </span>
                </div>
                <div style={{color: '#d1d5db', fontSize: 12}}>
                  {cut.reason}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #363741',
            background: '#18191f',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{padding: '8px 16px', background: '#252630', borderColor: '#43454f'}}
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={selectedCuts.length === 0}
            style={{
              padding: '8px 18px',
              background: '#e4b94f',
              color: '#111',
              fontWeight: 800,
              borderColor: '#e4b94f',
              cursor: selectedCuts.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Aplicar {selectedCuts.length} Cortes Selecionados
          </button>
        </div>
      </div>
    </div>
  );
};
