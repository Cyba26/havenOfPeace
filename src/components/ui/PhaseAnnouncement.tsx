'use client';
import React, { useEffect, useState } from 'react';
import { t } from '@/i18n';
import type { GamePhase } from '@/types/game';

interface PhaseAnnouncementProps {
  phase: GamePhase;
}

export function PhaseAnnouncement({ phase }: PhaseAnnouncementProps) {
  const [visible, setVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(phase);

  useEffect(() => {
    if (phase === currentPhase) return;
    // Don't announce setup or resolution (transient phases)
    if (phase === 'SCENARIO_SETUP' || phase === 'INITIATIVE_RESOLUTION' || phase === 'SCENARIO_COMPLETE' || phase === 'SCENARIO_FAILED') {
      setCurrentPhase(phase);
      return;
    }
    setCurrentPhase(phase);
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, [phase, currentPhase]);

  if (!visible) return null;

  const label = t(`phase.${phase}`);
  const isMonster = phase === 'MONSTER_TURN';
  const color = isMonster ? 'var(--color-blood-red-bright)' : 'var(--color-text-gold)';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 100 }}
    >
      <div
        className="phase-announcement px-12 py-4 rounded-lg"
        style={{
          background: 'rgba(10, 10, 15, 0.9)',
          border: `2px solid ${color}`,
          boxShadow: `0 0 40px ${color}40`,
        }}
      >
        <div
          className="text-2xl font-bold tracking-wider uppercase"
          style={{ fontFamily: 'var(--font-display)', color }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
