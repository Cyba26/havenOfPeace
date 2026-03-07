'use client';
import React from 'react';
import type { ItemDef, ItemState } from '@/types/items';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { t } from '@/i18n';

interface InventoryProps {
  itemDefs: ItemDef[];
  items: ItemState[];
  onUseItem: (itemDefId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

const USAGE_COLORS: Record<string, string> = {
  passive: '#4a9eff',
  spent: '#c4a55a',
  lost: '#c42a2a',
};

const SLOT_ICONS: Record<string, string> = {
  'single-hand': 'attack',
  'dual-hand': 'range',
  generic: 'loot',
};

export function Inventory({ itemDefs, items, onUseItem, disabled, compact }: InventoryProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--color-text-gold)' }}>
        {t('items')}
      </div>
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5`}>
        {items.map(itemState => {
          const def = itemDefs.find(d => d.id === itemState.defId);
          if (!def) return null;
          const isAvailable = !itemState.isSpent && !itemState.isLost;
          const usageKey = def.usage === 'passive' ? 'passive' : def.usage === 'lost' ? 'consumable' : 'recoverable';
          const itemName = t(`item.${def.id}`) !== `item.${def.id}` ? t(`item.${def.id}`) : def.name;
          const itemDesc = t(`item.${def.id}.desc`) !== `item.${def.id}.desc` ? t(`item.${def.id}.desc`) : def.description;
          const slotIcon = SLOT_ICONS[def.slot] || 'loot';
          const actionIcon = def.actions[0]?.type || 'loot';

          return (
            <button
              key={itemState.defId}
              onClick={() => isAvailable && !disabled && def.usage !== 'passive' && onUseItem(itemState.defId)}
              disabled={!isAvailable || disabled || def.usage === 'passive'}
              className="relative rounded-lg p-2 text-left transition-all"
              style={{
                background: isAvailable ? 'var(--color-bg-card)' : 'var(--color-bg-tertiary)',
                border: `1px solid ${isAvailable ? 'var(--color-gold-dim)' : 'rgba(255,255,255,0.05)'}`,
                opacity: isAvailable ? 1 : 0.45,
                boxShadow: isAvailable && !disabled && def.usage !== 'passive'
                  ? '0 0 8px rgba(196, 165, 90, 0.1)'
                  : 'none',
              }}
              title={itemDesc}
            >
              {/* Usage badge */}
              <div
                className="absolute top-1 right-1 text-[7px] uppercase font-bold px-1 py-0.5 rounded"
                style={{ background: USAGE_COLORS[def.usage], color: '#fff' }}
              >
                {t(usageKey)}
              </div>

              {/* Icon */}
              <div className="flex items-center gap-1 mb-1">
                <ActionIcon icon={actionIcon as any} size={18} color={isAvailable ? 'var(--color-text-gold)' : 'var(--color-text-muted)'} />
              </div>

              {/* Name */}
              <div className="text-[10px] font-semibold truncate" style={{ color: isAvailable ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                {itemName}
              </div>

              {/* Short desc */}
              <div className="text-[8px] mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                {def.actions.map((a, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <ActionIcon icon={a.type as any} size={8} />
                    {a.value}
                  </span>
                ))}
              </div>

              {/* Status overlay */}
              {itemState.isSpent && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    {t('spent')}
                  </span>
                </div>
              )}
              {itemState.isLost && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-blood-red-bright)' }}>
                    {t('lost_item')}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
