'use client';
import React from 'react';
import type { ElementType } from '@/types/cards';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { t } from '@/i18n';

const ALL_ELEMENTS: ElementType[] = ['fire', 'ice', 'air', 'earth', 'light', 'dark'];

const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#e84040',
  ice: '#4a9ade',
  air: '#b0b8c0',
  earth: '#7a6030',
  light: '#f0d860',
  dark: '#5a3a8a',
};

interface ElementTrackerProps {
  infusedElements: Set<ElementType>;
}

export function ElementTracker({ infusedElements }: ElementTrackerProps) {
  return (
    <div className="flex gap-1.5 items-center flex-wrap justify-center">
      {ALL_ELEMENTS.map(el => {
        const isActive = infusedElements.has(el);
        return (
          <div
            key={el}
            className={`w-7 h-7 rounded-full flex items-center justify-center ${isActive ? 'element-infused' : ''}`}
            style={{
              background: isActive ? ELEMENT_COLORS[el] : 'var(--color-bg-tertiary)',
              opacity: isActive ? 1 : 0.3,
              border: isActive ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? `0 0 8px ${ELEMENT_COLORS[el]}60` : 'none',
              color: ELEMENT_COLORS[el],
            }}
            title={`${t(`element.${el}`)}${isActive ? ` (${t('infused')})` : ''}`}
          >
            <ActionIcon icon={el} size={14} />
          </div>
        );
      })}
    </div>
  );
}
