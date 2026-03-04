'use client';
import React from 'react';
import type { AbilityCardDef, CardState } from '@/types/cards';
import { AbilityCard } from './AbilityCard';

interface CardHandProps {
  cardDefs: AbilityCardDef[];
  cardStates: CardState[];
  selectedCards: [string, string] | null;
  initiativeCard: string | null;
  phase: 'selection' | 'view-only';
  onSelectCard?: (defId: string) => void;
  onDeselectCard?: (defId: string) => void;
  onSetInitiative?: (defId: string) => void;
}

export function CardHand({
  cardDefs, cardStates, selectedCards, initiativeCard,
  phase, onSelectCard, onDeselectCard, onSetInitiative,
}: CardHandProps) {
  const handCards = cardStates.filter(cs => cs.location === 'hand');

  if (handCards.length === 0) {
    return (
      <div className="flex justify-center p-4" style={{ color: 'var(--color-text-muted)' }}>
        No cards in hand
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-center flex-wrap p-4">
      {handCards.map(cs => {
        const def = cardDefs.find(d => d.id === cs.defId);
        if (!def) return null;

        const isSelected = selectedCards?.[0] === cs.defId || selectedCards?.[1] === cs.defId;
        const isInit = initiativeCard === cs.defId;
        const selectionFull = selectedCards?.[0] && selectedCards?.[1];

        return (
          <AbilityCard
            key={cs.defId}
            cardDef={def}
            cardState={cs}
            isSelected={isSelected}
            isInitiativeCard={isInit}
            disabled={phase === 'view-only'}
            onSelect={() => {
              if (phase !== 'selection') return;
              if (isSelected) {
                onDeselectCard?.(cs.defId);
              } else if (!selectionFull) {
                onSelectCard?.(cs.defId);
              }
            }}
            onSetInitiative={isSelected ? () => onSetInitiative?.(cs.defId) : undefined}
          />
        );
      })}
    </div>
  );
}
