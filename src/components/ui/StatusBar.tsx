'use client';
import React from 'react';
import type { GamePhase } from '@/types/game';

interface StatusBarProps {
  round: number;
  phase: GamePhase;
  hp: number;
  maxHP: number;
  handCount: number;
  discardCount: number;
  lostCount: number;
  children?: React.ReactNode;
}

const PHASE_LABELS: Record<GamePhase, string> = {
  SCENARIO_SETUP: 'Setup',
  CARD_SELECTION: 'Select Cards',
  INITIATIVE_RESOLUTION: 'Initiative',
  PLAYER_TURN: 'Your Turn',
  MONSTER_TURN: 'Monster Turn',
  END_OF_ROUND: 'End of Round',
  RESTING: 'Resting',
  SCENARIO_COMPLETE: 'Victory!',
  SCENARIO_FAILED: 'Defeated',
};

export function StatusBar({ round, phase, hp, maxHP, handCount, discardCount, lostCount, children }: StatusBarProps) {
  const hpPercent = maxHP > 0 ? hp / maxHP : 0;
  const hpColor = hpPercent > 0.5 ? 'var(--color-health-green-bright)' : hpPercent > 0.25 ? 'var(--color-gold)' : 'var(--color-blood-red-bright)';

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 text-xs"
      style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-gold-dim)' }}
    >
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-gold)' }} className="font-semibold">
        Round {round}
      </div>
      <div className="px-2 py-0.5 rounded" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
        {PHASE_LABELS[phase]}
      </div>
      <div className="flex items-center gap-1.5">
        <span style={{ color: hpColor }} className="font-bold">{hp}/{maxHP} HP</span>
        <div className="w-16 h-2 rounded-full" style={{ background: 'var(--color-bg-primary)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${hpPercent * 100}%`, background: hpColor }} />
        </div>
      </div>
      <div className="flex gap-2" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Hand: {handCount}</span>
        <span>Discard: {discardCount}</span>
        <span>Lost: {lostCount}</span>
      </div>
      {children}
    </div>
  );
}
