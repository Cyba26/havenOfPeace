'use client';
import React from 'react';
import { t } from '@/i18n';

interface ModifierPopupProps {
  value: number;
  isMiss: boolean;
  isDouble: boolean;
}

export function ModifierPopup({ value, isMiss, isDouble }: ModifierPopupProps) {
  let display: string;
  let color: string;

  if (isMiss) {
    display = 'MISS';
    color = 'var(--color-blood-red-bright)';
  } else if (isDouble) {
    display = 'x2';
    color = 'var(--color-gold-bright)';
  } else if (value > 0) {
    display = `+${value}`;
    color = 'var(--color-health-green-bright)';
  } else if (value < 0) {
    display = `${value}`;
    color = 'var(--color-blood-red-bright)';
  } else {
    display = '+0';
    color = 'var(--color-text-secondary)';
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 95 }}>
      <div
        className="modifier-card-popup flex flex-col items-center justify-center"
        style={{
          width: '100px',
          height: '140px',
          background: 'var(--color-bg-card)',
          border: `3px solid ${color}`,
          borderRadius: '12px',
          boxShadow: `0 0 40px ${color}60, 0 8px 32px rgba(0,0,0,0.8)`,
        }}
      >
        <div style={{
          fontSize: isMiss || isDouble ? '24px' : '36px',
          fontWeight: 'bold',
          fontFamily: 'var(--font-display)',
          color,
          textShadow: `0 0 12px ${color}80`,
        }}>
          {display}
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          marginTop: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {t('modifier')}
        </div>
      </div>
    </div>
  );
}
