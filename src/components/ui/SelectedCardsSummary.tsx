'use client';
import React from 'react';
import type { AbilityCardDef, CardState, AbilityAction } from '@/types/cards';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { t } from '@/i18n';

interface SelectedCardsSummaryProps {
  selectedCards: [string, string];
  cardDefs: AbilityCardDef[];
  cardStates: CardState[];
  topCardId: string | null;
  bottomCardId: string | null;
  currentActionIndex?: number;
}

function ActionLine({ action, isActive }: { action: AbilityAction; isActive: boolean }) {
  const iconMap: Record<string, string> = {
    attack: 'attack', move: 'move', heal: 'heal', shield: 'shield',
    push: 'push', pull: 'pull', retaliate: 'retaliate', loot: 'loot',
  };
  const iconName = iconMap[action.type] || action.type;
  const actionLabel = t(`action.${action.type}`);

  return (
    <div
      className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
      style={{
        background: isActive ? 'rgba(196, 165, 90, 0.15)' : 'transparent',
        color: isActive ? 'var(--color-text-gold)' : 'var(--color-text-secondary)',
      }}
    >
      <ActionIcon icon={iconName as any} size={12} />
      <span>{actionLabel} {action.value ?? ''}</span>
      {action.range && <span className="text-[8px]">({t('action.range')} {action.range})</span>}
      {action.target && action.target > 1 && <span className="text-[8px]">x{action.target}</span>}
      {action.piercing && <span className="text-[8px]">({t('action.pierce')} {action.piercing})</span>}
      {action.jump && <ActionIcon icon="jump" size={10} />}
      {action.condition && <ActionIcon icon={action.condition} size={10} />}
    </div>
  );
}

export function SelectedCardsSummary({
  selectedCards, cardDefs, cardStates, topCardId, bottomCardId, currentActionIndex,
}: SelectedCardsSummaryProps) {
  const getCard = (defId: string) => {
    const def = cardDefs.find(d => d.id === defId);
    const state = cardStates.find(s => s.defId === defId);
    return { def, state };
  };

  const renderCardSection = (defId: string | null, half: 'top' | 'bottom', label: string) => {
    if (!defId || defId.startsWith('__default_')) {
      const isDefault = defId?.startsWith('__default_');
      return (
        <div className="mb-2">
          <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </div>
          {isDefault && (
            <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              <ActionIcon icon={half === 'top' ? 'attack' : 'move'} size={11} />
              <span>{half === 'top' ? `${t('action.attack')} 2` : `${t('action.move')} 2`}</span>
            </div>
          )}
        </div>
      );
    }

    const { def, state } = getCard(defId);
    if (!def || !state) return null;
    const sideData = state.currentSide === 'A' ? def.sideA : def.sideB;
    const actions = half === 'top' ? sideData.top.actions : sideData.bottom.actions;
    const isLost = half === 'top' ? sideData.top.isLost : sideData.bottom.isLost;

    return (
      <div className="mb-2">
        <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {label} — {def.name}
        </div>
        {actions.map((action, i) => (
          <ActionLine key={i} action={action} isActive={currentActionIndex === i} />
        ))}
        {isLost && (
          <div className="text-[8px] mt-0.5" style={{ color: 'var(--color-blood-red-bright)' }}>PERDU</div>
        )}
      </div>
    );
  };

  return (
    <div
      className="rounded-lg p-2.5"
      style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-gold-dim)' }}
    >
      <div className="text-[9px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--color-text-gold)' }}>
        Cartes en jeu
      </div>
      {renderCardSection(topCardId, 'top', t('top'))}
      <div style={{ borderTop: '1px dashed var(--color-text-muted)' }} className="my-1" />
      {renderCardSection(bottomCardId, 'bottom', t('bottom'))}
    </div>
  );
}
