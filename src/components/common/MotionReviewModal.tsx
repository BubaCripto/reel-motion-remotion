import React, { useState } from 'react';
import { formatTimecode } from '../../types/editor';
import type { DirectorBlueprint, DirectorMotionItem } from '../../lib/motionCompiler';

type Props = {
  blueprint: DirectorBlueprint | null;
  fps: number;
  onApply: (filteredBlueprint: DirectorBlueprint) => void;
  onCancel: () => void;
};

export const MotionReviewModal: React.FC<Props> = ({
  blueprint,
  fps,
  onApply,
  onCancel
}) => {
  if (!blueprint) return null;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(blueprint.motionLayers.map(m => m.id));
  });

  const toggleItem = (id: string) => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (select: boolean) => {
    if (select) {
      setSelectedIds(new Set(blueprint.motionLayers.map(m => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleApply = () => {
    const activeMotions = blueprint.motionLayers.filter(m => selectedIds.has(m.id));
    onApply({
      ...blueprint,
      motionLayers: activeMotions
    });
  };

  const getIconForType = (item: DirectorMotionItem) => {
    if (item.type === 'scene') {
      const s = item.motionProps?.scene;
      if (s === 'rocket-launch') return '🚀';
      if (s === 'growth-graph') return '📈';
      if (s === 'target-lock') return '🎯';
      if (s === 'stamp-impact') return '💥';
      if (s === 'hazard-warning') return '⚠️';
      if (s === 'hourglass') return '⏳';
      if (s === 'speed-gauge') return '🏎️';
      if (s === 'neural-brain') return '🧠';
      return '🎬';
    }
    if (item.type === 'kinetic-text') return '🔤';
    if (item.type === 'stroke-path') return '↗️';
    if (item.type === 'burst') return '✨';
    if (item.type === 'speed-lines') return '⚡';
    if (item.type === 'camera-shake') return '📳';
    return '🎨';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
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
          background: '#15161c',
          border: '1px solid #ffe043',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 224, 67, 0.15)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #282a36',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #1d1e26, #15161c)'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#ffe043', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎬</span> Direção de Motion Graphics com IA
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
              Estilo: <strong style={{ color: '#fff' }}>{blueprint.style}</strong> · Ritmo: <strong style={{ color: '#fff' }}>{blueprint.intensity}</strong>
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        {/* Vision Banner */}
        <div
          style={{
            padding: '12px 24px',
            background: '#1d1e26',
            borderBottom: '1px solid #282a36',
            fontSize: 13,
            color: '#e2e8f0',
            lineHeight: 1.4
          }}
        >
          {blueprint.directorVision}
        </div>

        {/* Stat Counter Pills */}
        <div
          style={{
            padding: '12px 24px',
            display: 'flex',
            gap: 12,
            background: '#181922',
            borderBottom: '1px solid #282a36',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ background: '#222330', padding: '6px 14px', borderRadius: 20, fontSize: 12, color: '#ffe043' }}>
            🎨 <strong>{selectedIds.size}</strong> de {blueprint.motionLayers.length} camadas ativas
          </div>
          <div style={{ background: '#222330', padding: '6px 14px', borderRadius: 20, fontSize: 12, color: '#00f0ff' }}>
            🔊 <strong>{blueprint.soundDesign.length}</strong> efeitos sonoros sincronizados
          </div>
          {blueprint.cameraPunches.length > 0 && (
            <div style={{ background: '#222330', padding: '6px 14px', borderRadius: 20, fontSize: 12, color: '#ff6b9e' }}>
              📸 <strong>{blueprint.cameraPunches.length}</strong> cortes com flash/zoom
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={() => toggleAll(true)}
              style={{
                background: 'transparent',
                border: '1px solid #374151',
                color: '#cbd5e1',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              Marcar todos
            </button>
            <button
              onClick={() => toggleAll(false)}
              style={{
                background: 'transparent',
                border: '1px solid #374151',
                color: '#cbd5e1',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              Desmarcar todos
            </button>
          </div>
        </div>

        {/* Scrollable List of Generated Motion Layers */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {blueprint.motionLayers.map(item => {
            const isChecked = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: isChecked ? '#1c1e27' : '#14151b',
                  border: `1px solid ${isChecked ? '#ffe04344' : '#282a36'}`,
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // handled by parent onClick
                  style={{ accentColor: '#ffe043', width: 16, height: 16, cursor: 'pointer' }}
                />

                <span style={{ fontSize: 22 }}>{getIconForType(item)}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: isChecked ? '#ffffff' : '#6b7280' }}>
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: '#2b2d3c',
                        color: item.color || '#ffe043',
                        fontFamily: 'monospace'
                      }}
                    >
                      {item.type}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    Tempo: {formatTimecode(item.start, fps)} → {formatTimecode(item.end, fps)} ({((item.end - item.start)).toFixed(2)}s)
                  </div>
                </div>

                {item.sfx && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: '#00f0ff',
                      background: '#0a2530',
                      padding: '4px 8px',
                      borderRadius: 6
                    }}
                  >
                    <span>🔊</span>
                    <span>{item.sfx}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #282a36',
            background: '#15161c',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid #374151',
              background: 'transparent',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={selectedIds.size === 0}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: selectedIds.size > 0 ? '#ffe043' : '#4b5563',
              color: '#111827',
              fontWeight: 800,
              fontSize: 14,
              cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
              boxShadow: selectedIds.size > 0 ? '0 0 20px rgba(255, 224, 67, 0.4)' : 'none'
            }}
          >
            ✨ Aplicar {selectedIds.size} Efeitos na Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
