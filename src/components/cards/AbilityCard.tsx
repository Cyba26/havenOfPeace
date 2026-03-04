'use client';
import React from 'react';
import type { AbilityCardDef, CardState, AbilityAction } from '@/types/cards';

interface AbilityCardProps {
  cardDef: AbilityCardDef;
  cardState: CardState;
  isSelected?: boolean;
  isInitiativeCard?: boolean;
  onSelect?: () => void;
  onSetInitiative?: () => void;
  disabled?: boolean;
}

function ActionText({ action }: { action: AbilityAction }) {
  const parts: string[] = [];
  switch (action.type) {
    case 'attack':
      parts.push(`Attack ${action.value ?? '?'}`);
      if (action.range) parts.push(`Range ${action.range}`);
      if (action.target && action.target > 1) parts.push(`x${action.target}`);
      if (action.piercing) parts.push(`Pierce ${action.piercing}`);
      break;
    case 'move':
      parts.push(`Move ${action.value ?? '?'}`);
      if (action.jump) parts.push('(Jump)');
      break;
    case 'heal':
      parts.push(`Heal ${action.value ?? '?'}`);
      break;
    case 'shield':
      parts.push(`Shield ${action.value ?? '?'}`);
      break;
    case 'push':
      parts.push(`Push ${action.value ?? '?'}`);
      break;
    case 'pull':
      parts.push(`Pull ${action.value ?? '?'}`);
      break;
    case 'condition':
      parts.push(action.condition ?? 'condition');
      break;
    default:
      parts.push(action.type);
  }
  return <span>{parts.join(' / ')}</span>;
}

export function AbilityCard({
  cardDef, cardState, isSelected, isInitiativeCard,
  onSelect, onSetInitiative, disabled,
}: AbilityCardProps) {
  const side = cardState.currentSide;
  const sideData = side === 'A' ? cardDef.sideA : cardDef.sideB;

  return (
    <div
      className={`ability-card ${side === 'A' ? 'ability-card--side-a' : 'ability-card--side-b'} ${isSelected ? 'ability-card--selected' : ''} p-3 flex flex-col gap-1.5 select-none ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      onClick={() => !disabled && onSelect?.()}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
          {cardDef.name}
        </span>
        <div className="flex items-center gap-1">
          {isInitiativeCard && (
            <span className="text-[9px] px-1 rounded font-bold" style={{ background: 'var(--color-gold)', color: 'var(--color-bg-primary)' }}>
              INIT
            </span>
          )}
          <span className={`text-[10px] px-1 py-0.5 rounded text-white font-bold`}
            style={{ background: side === 'A' ? 'var(--color-side-a)' : 'var(--color-side-b)' }}>
            {side}
          </span>
        </div>
      </div>

      {/* Initiative */}
      <div className="text-center text-lg font-bold" style={{ color: 'var(--color-text-secondary)' }}>
        {sideData.initiative}
      </div>

      {/* Top half */}
      <div className="pt-1" style={{ borderTop: '1px solid var(--color-gold-dim)' }}>
        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Top</div>
        {sideData.top.actions.map((action, i) => (
          <div key={i} className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
            <ActionText action={action} />
            {sideData.top.isLost && <span style={{ color: 'var(--color-blood-red-bright)' }} className="ml-1 text-[10px]">[LOST]</span>}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed var(--color-text-muted)' }} />

      {/* Bottom half */}
      <div>
        <div className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Bottom</div>
        {sideData.bottom.actions.map((action, i) => (
          <div key={i} className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
            <ActionText action={action} />
            {sideData.bottom.isLost && <span style={{ color: 'var(--color-blood-red-bright)' }} className="ml-1 text-[10px]">[LOST]</span>}
          </div>
        ))}
      </div>

      {/* Initiative selector */}
      {isSelected && onSetInitiative && (
        <button
          onClick={(e) => { e.stopPropagation(); onSetInitiative(); }}
          className={`text-[10px] mt-1 py-1 rounded transition-colors ${isInitiativeCard ? 'font-bold' : ''}`}
          style={{
            background: isInitiativeCard ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
            color: isInitiativeCard ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
          }}
        >
          {isInitiativeCard ? 'Initiative Card' : 'Set as Initiative'}
        </button>
      )}
    </div>
  );
}
