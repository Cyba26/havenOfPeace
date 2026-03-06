'use client';
import React, { useState } from 'react';
import type { CardState, AbilityCardDef } from '@/types/cards';
import { getASideHandCards, getBSideHandCards, getLossableCards } from '@/engine/cards';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { t } from '@/i18n';

interface DamageNegationProps {
  damage: number;
  source: string;
  cards: CardState[];
  cardDefs: AbilityCardDef[];
  selectedCardIds: string[];
  onAccept: () => void;
  onDiscardA: (cardDefId: string) => void;
  onDiscard2B: (cardDefId1: string, cardDefId2: string) => void;
  onLoseCard: (cardDefId: string) => void;
}

export function DamageNegation({
  damage, source, cards, cardDefs, selectedCardIds,
  onAccept, onDiscardA, onDiscard2B, onLoseCard,
}: DamageNegationProps) {
  const [selectedBCards, setSelectedBCards] = useState<string[]>([]);
  const [mode, setMode] = useState<'choose' | 'discard_a' | 'discard_2b' | 'lose'>('choose');

  const availableCards = cards.filter(c => !selectedCardIds.includes(c.defId));
  const aSideCards = getASideHandCards(availableCards);
  const bSideCards = getBSideHandCards(availableCards);
  const lossableCards = getLossableCards(availableCards);

  const getCardName = (defId: string) => cardDefs.find(d => d.id === defId)?.name ?? defId;

  if (mode === 'choose') {
    return (
      <div className="rounded-lg p-4" style={{ background: 'var(--color-bg-tertiary)', border: '2px solid var(--color-blood-red-bright)' }}>
        <div className="text-sm font-bold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-blood-red-bright)' }}>
          <ActionIcon icon="wound" size={16} color="var(--color-blood-red-bright)" />
          {t('incoming_damage')}: {damage}
        </div>
        <div className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          {source} — {t('damage_choose')}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onAccept} className="btn-secondary text-xs">
            {t('accept_damage', { n: damage })}
          </button>
          {aSideCards.length > 0 && (
            <button onClick={() => setMode('discard_a')} className="btn-secondary text-xs">
              {t('discard_a')}
            </button>
          )}
          {bSideCards.length >= 2 && (
            <button onClick={() => setMode('discard_2b')} className="btn-secondary text-xs">
              {t('discard_2b')}
            </button>
          )}
          {lossableCards.length > 0 && (
            <button onClick={() => setMode('lose')} className="btn-secondary text-xs">
              {t('lose_card')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'discard_a') {
    return (
      <div className="rounded-lg p-4" style={{ background: 'var(--color-bg-tertiary)', border: '2px solid var(--color-blood-red-bright)' }}>
        <div className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-gold)' }}>
          {t('discard_a_pick')}
        </div>
        <div className="flex flex-col gap-1">
          {aSideCards.map(c => (
            <button key={c.defId} onClick={() => onDiscardA(c.defId)} className="btn-secondary text-xs">
              {getCardName(c.defId)}
            </button>
          ))}
        </div>
        <button onClick={() => setMode('choose')} className="text-xs mt-2 underline" style={{ color: 'var(--color-text-muted)' }}>
          {t('back')}
        </button>
      </div>
    );
  }

  if (mode === 'discard_2b') {
    return (
      <div className="rounded-lg p-4" style={{ background: 'var(--color-bg-tertiary)', border: '2px solid var(--color-blood-red-bright)' }}>
        <div className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-gold)' }}>
          {t('discard_2b_pick')}
        </div>
        <div className="flex flex-col gap-1">
          {bSideCards.map(c => {
            const isSelected = selectedBCards.includes(c.defId);
            return (
              <button
                key={c.defId}
                onClick={() => {
                  if (isSelected) {
                    setSelectedBCards(prev => prev.filter(id => id !== c.defId));
                  } else if (selectedBCards.length < 2) {
                    const next = [...selectedBCards, c.defId];
                    if (next.length === 2) {
                      onDiscard2B(next[0], next[1]);
                    } else {
                      setSelectedBCards(next);
                    }
                  }
                }}
                className="btn-secondary text-xs"
                style={isSelected ? { border: '2px solid var(--color-text-gold)' } : {}}
              >
                {getCardName(c.defId)} {isSelected ? `(${t('selected')})` : ''}
              </button>
            );
          })}
        </div>
        <button onClick={() => { setMode('choose'); setSelectedBCards([]); }} className="text-xs mt-2 underline" style={{ color: 'var(--color-text-muted)' }}>
          {t('back')}
        </button>
      </div>
    );
  }

  if (mode === 'lose') {
    return (
      <div className="rounded-lg p-4" style={{ background: 'var(--color-bg-tertiary)', border: '2px solid var(--color-blood-red-bright)' }}>
        <div className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-gold)' }}>
          {t('lose_card_pick')}
        </div>
        <div className="flex flex-col gap-1">
          {lossableCards.map(c => (
            <button key={c.defId} onClick={() => onLoseCard(c.defId)} className="btn-secondary text-xs">
              {getCardName(c.defId)} ({c.currentSide})
            </button>
          ))}
        </div>
        <button onClick={() => setMode('choose')} className="text-xs mt-2 underline" style={{ color: 'var(--color-text-muted)' }}>
          {t('back')}
        </button>
      </div>
    );
  }

  return null;
}
