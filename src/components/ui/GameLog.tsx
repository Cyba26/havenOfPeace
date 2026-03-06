'use client';
import React, { useEffect, useRef } from 'react';

interface GameLogProps {
  entries: string[];
}

export function GameLog({ entries }: GameLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div
      ref={containerRef}
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
    </div>
  );
}
