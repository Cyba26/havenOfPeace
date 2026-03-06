'use client';
import React, { useEffect, useState } from 'react';

export interface PopupEvent {
  id: number;
  value: number;
  type: 'damage' | 'heal' | 'shield';
  x: number;
  y: number;
}

interface DamagePopupProps {
  events: PopupEvent[];
  onDone: (id: number) => void;
}

const COLORS = {
  damage: 'var(--color-blood-red-bright)',
  heal: 'var(--color-health-green-bright)',
  shield: 'var(--color-ice-blue)',
};

const PREFIXES = {
  damage: '-',
  heal: '+',
  shield: '',
};

const SUFFIXES = {
  damage: '',
  heal: '',
  shield: ' BOU',
};

function Popup({ event, onDone }: { event: PopupEvent; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="damage-popup absolute pointer-events-none font-bold"
      style={{
        left: event.x,
        top: event.y,
        color: COLORS[event.type],
        fontSize: event.type === 'damage' ? '24px' : '18px',
        fontFamily: 'var(--font-display)',
        textShadow: `0 0 8px ${COLORS[event.type]}80`,
      }}
    >
      {PREFIXES[event.type]}{event.value}{SUFFIXES[event.type]}
    </div>
  );
}

export function DamagePopupLayer({ events, onDone }: DamagePopupProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 60 }}>
      {events.map(ev => (
        <Popup key={ev.id} event={ev} onDone={() => onDone(ev.id)} />
      ))}
    </div>
  );
}
