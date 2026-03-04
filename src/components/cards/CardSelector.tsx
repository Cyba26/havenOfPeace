'use client';
import React from 'react';
import type { AbilityCardDef, CardState } from '@/types/cards';

interface CardSelectorProps {
  selectedCards: [string, string];
  cardDefs: AbilityCardDef[];
  cardStates: CardState[];
  topCardId: string | null;
  bottomCardId: string | null;
  onChooseTop: (defId: string) => void;
  onChooseBottom: (defId: string) => void;
  onConfirm: () => void;
  onUseDefaultTop: () => void;
  onUseDefaultBottom: () => void;
}

export function CardSelector({
  selectedCards, cardDefs, cardStates,
  topCardId, bottomCardId,
  onChooseTop, onChooseBottom, onConfirm,
  onUseDefaultTop, onUseDefaultBottom,
}: CardSelectorProps) {
  const getName = (defId: string) => {
    const def = cardDefs.find(d => d.id === defId);
    const st = cardStates.find(s => s.defId === defId);
    if (!def || !st) return defId;
    return `${def.name} (${st.currentSide})`;
  };

  const isAssigned = topCardId && bottomCardId;

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-gold-dim)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
        Assign Actions
      </h3>

      {/* Top action */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
          Top Action from:
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {selectedCards.filter(Boolean).map(defId => (
            <button
              key={defId}
              onClick={() => onChooseTop(defId)}
              className="flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors"
              style={{
                background: topCardId === defId ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
                color: topCardId === defId ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {getName(defId)}
            </button>
          ))}
          <button
            onClick={onUseDefaultTop}
            className="px-2 py-1.5 rounded text-xs transition-colors"
            style={{
              background: topCardId === '__default_top__' ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
              color: topCardId === '__default_top__' ? 'var(--color-bg-primary)' : 'var(--color-text-muted)',
            }}
          >
            Default (Atk 2)
          </button>
        </div>
      </div>

      {/* Bottom action */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
          Bottom Action from:
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {selectedCards.filter(Boolean).map(defId => {
            const isBlocked = topCardId === defId;
            return (
              <button
                key={defId}
                onClick={() => !isBlocked && onChooseBottom(defId)}
                disabled={isBlocked}
                className="flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors"
                style={{
                  background: bottomCardId === defId ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
                  color: bottomCardId === defId ? 'var(--color-bg-primary)' : isBlocked ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  opacity: isBlocked ? 0.3 : 1,
                }}
              >
                {getName(defId)}
              </button>
            );
          })}
          <button
            onClick={onUseDefaultBottom}
            className="px-2 py-1.5 rounded text-xs transition-colors"
            style={{
              background: bottomCardId === '__default_bottom__' ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
              color: bottomCardId === '__default_bottom__' ? 'var(--color-bg-primary)' : 'var(--color-text-muted)',
            }}
          >
            Default (Move 2)
          </button>
        </div>
      </div>

      {/* Confirm */}
      {isAssigned && (
        <button onClick={onConfirm} className="btn-primary w-full">
          Execute Actions
        </button>
      )}
    </div>
  );
}
