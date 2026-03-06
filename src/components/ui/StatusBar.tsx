'use client';
import React from 'react';
import type { GamePhase } from '@/types/game';
import { t } from '@/i18n';

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

export function StatusBar({ round, phase, hp, maxHP, handCount, discardCount, lostCount, children }: StatusBarProps) {
  const hpPercent = maxHP > 0 ? hp / maxHP : 0;
  const hpColor = hpPercent > 0.5 ? 'var(--color-health-green-bright)' : hpPercent > 0.25 ? 'var(--color-gold)' : 'var(--color-blood-red-bright)';
  const phaseLabel = t(`phase.${phase}`);

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 text-xs"
      style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-gold-dim)' }}
    >
      <div style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-gold)' }} className="font-semibold">
        {t('round')} {round}
      </div>
      <div className="px-2 py-0.5 rounded" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
        {phaseLabel}
      </div>
      <div className="flex items-center gap-1.5">
        <span style={{ color: hpColor }} className="font-bold">{hp}/{maxHP} {t('hp')}</span>
        <div className="w-16 h-2 rounded-full" style={{ background: 'var(--color-bg-primary)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${hpPercent * 100}%`, background: hpColor }} />
        </div>
      </div>
      <div className="flex gap-2" style={{ color: 'var(--color-text-secondary)' }}>
        <span>{t('hand')}: {handCount}</span>
        <span>{t('discard')}: {discardCount}</span>
        <span>{t('lost')}: {lostCount}</span>
      </div>
      {children}
    </div>
  );
}
