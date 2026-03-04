'use client';
import React, { useEffect, useRef } from 'react';

interface GameLogProps {
  entries: string[];
}

export function GameLog({ entries }: GameLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div
      className="flex flex-col gap-0 overflow-y-auto text-xs"
      style={{ maxHeight: '200px', background: 'var(--color-bg-primary)', padding: '0.5rem' }}
    >
      {entries.length === 0 && (
        <div style={{ color: 'var(--color-text-muted)' }}>No events yet.</div>
      )}
      {entries.map((entry, i) => (
        <div key={i} className="game-log-entry py-1 px-1">
          {entry}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
