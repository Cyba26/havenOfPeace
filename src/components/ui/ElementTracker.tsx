'use client';
import React from 'react';
import type { ElementType } from '@/types/cards';

const ALL_ELEMENTS: ElementType[] = ['fire', 'ice', 'air', 'earth', 'light', 'dark'];

const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#e84040',
  ice: '#4a9ade',
  air: '#b0b8c0',
  earth: '#7a6030',
  light: '#f0d860',
  dark: '#5a3a8a',
};

const ELEMENT_ICONS: Record<ElementType, string> = {
  fire: '\u{1F525}',
  ice: '\u{2744}\u{FE0F}',
  air: '\u{1F4A8}',
  earth: '\u{1FAA8}',
  light: '\u{2600}\u{FE0F}',
  dark: '\u{1F31A}',
};

interface ElementTrackerProps {
  infusedElements: Set<ElementType>;
}

export function ElementTracker({ infusedElements }: ElementTrackerProps) {
  return (
    <div className="flex gap-1.5 items-center">
      {ALL_ELEMENTS.map(el => {
        const isActive = infusedElements.has(el);
        return (
          <div
            key={el}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
            style={{
              background: isActive ? ELEMENT_COLORS[el] : 'var(--color-bg-tertiary)',
              opacity: isActive ? 1 : 0.3,
              border: isActive ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? `0 0 8px ${ELEMENT_COLORS[el]}60` : 'none',
            }}
            title={`${el}${isActive ? ' (infused)' : ''}`}
          >
            {ELEMENT_ICONS[el]}
          </div>
        );
      })}
    </div>
  );
}
