'use client';
import React from 'react';
import type { ItemDef, ItemState } from '@/types/items';

interface ItemBarProps {
  itemDefs: ItemDef[];
  items: ItemState[];
  onUseItem: (itemDefId: string) => void;
  disabled?: boolean;
}

export function ItemBar({ itemDefs, items, onUseItem, disabled }: ItemBarProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        Items
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {items.map(itemState => {
          const def = itemDefs.find(d => d.id === itemState.defId);
          if (!def) return null;
          const isAvailable = !itemState.isSpent && !itemState.isLost;
          const usageLabel = def.usage === 'passive' ? 'passive' : def.usage === 'lost' ? 'consumable' : 'recoverable';

          return (
            <button
              key={itemState.defId}
              onClick={() => isAvailable && !disabled && def.usage !== 'passive' && onUseItem(itemState.defId)}
              disabled={!isAvailable || disabled || def.usage === 'passive'}
              className="text-xs px-2 py-1 rounded"
              style={{
                background: isAvailable ? 'var(--color-bg-primary)' : 'var(--color-bg-tertiary)',
                color: isAvailable ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: `1px solid ${isAvailable ? 'var(--color-gold-dim)' : 'rgba(255,255,255,0.1)'}`,
                opacity: isAvailable ? 1 : 0.5,
              }}
              title={`${def.description} (${usageLabel})${itemState.isSpent ? ' — spent' : ''}${itemState.isLost ? ' — lost' : ''}`}
            >
              {def.name}
              {itemState.isSpent && <span className="ml-1 text-[10px]">(spent)</span>}
              {itemState.isLost && <span className="ml-1 text-[10px]">(lost)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
