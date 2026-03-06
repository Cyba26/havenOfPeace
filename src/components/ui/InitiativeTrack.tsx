'use client';
import React from 'react';
import type { InitiativeEntry } from '@/types/game';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { t } from '@/i18n';

interface InitiativeTrackProps {
  turnOrder: InitiativeEntry[];
  currentTurnIndex: number;
}

export function InitiativeTrack({ turnOrder, currentTurnIndex }: InitiativeTrackProps) {
  if (turnOrder.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-lg"
      style={{
        background: 'rgba(10,10,15,0.85)',
        border: '1px solid var(--color-gold-dim)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {turnOrder.map((entry, i) => {
        const isCurrent = i === currentTurnIndex;
        const isResolved = entry.resolved;
        const isCharacter = entry.entityType === 'character';
        const color = isCharacter ? '#4a9eff' : 'var(--color-blood-red-bright)';

        return (
          <div
            key={`${entry.entityId}-${i}`}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all"
            style={{
              background: isCurrent ? (isCharacter ? 'rgba(74,158,255,0.25)' : 'rgba(196,42,42,0.25)') : 'transparent',
              border: isCurrent ? `1px solid ${color}` : '1px solid transparent',
              opacity: isResolved ? 0.35 : 1,
              color,
            }}
          >
            {isCharacter
              ? <ActionIcon icon="shield" size={10} />
              : <ActionIcon icon="attack" size={10} color={color} />
            }
            <span>{isCharacter ? t('player') : entry.entityId}</span>
            <span className="text-[8px]" style={{ color: 'var(--color-text-muted)' }}>{entry.initiative}</span>
          </div>
        );
      })}
    </div>
  );
}
