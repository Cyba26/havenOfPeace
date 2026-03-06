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
      className="flex flex-col gap-3 p-3 rounded-lg"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-gold-dim)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
        width: '160px',
      }}
    >
      {/* Round */}
      <div className="text-center" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-gold)' }}>
        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{t('round')}</div>
        <div className="text-2xl font-bold">{round}</div>
      </div>

      {/* Phase */}
      <div className="text-center px-1.5 py-1 rounded text-[10px] font-semibold" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
        {phaseLabel}
      </div>

      {/* HP */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{t('hp')}</span>
          <span style={{ color: hpColor }} className="text-sm font-bold">{hp}/{maxHP}</span>
        </div>
        <div className="w-full h-2.5 rounded-full" style={{ background: 'var(--color-bg-primary)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${hpPercent * 100}%`, background: hpColor }} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--color-bg-tertiary)' }} />

      {/* Card counts */}
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>{t('hand')}</span>
          <span style={{ color: 'var(--color-text-primary)' }} className="font-semibold">{handCount}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>{t('discard')}</span>
          <span style={{ color: 'var(--color-text-secondary)' }} className="font-semibold">{discardCount}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>{t('lost')}</span>
          <span style={{ color: 'var(--color-blood-red-bright)' }} className="font-semibold">{lostCount}</span>
        </div>
      </div>

      {/* Children (ElementTracker, buttons) */}
      {children}
    </div>
  );
}
