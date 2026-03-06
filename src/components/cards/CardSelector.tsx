'use client';
import React from 'react';
import type { AbilityCardDef, CardState, AbilityAction } from '@/types/cards';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { t } from '@/i18n';

interface CardSelectorProps {
  selectedCards: [string, string];
  cardDefs: AbilityCardDef[];
  cardStates: CardState[];
  topCardId: string | null;
  bottomCardId: string | null;
  actionOrder: 'top_first' | 'bottom_first';
  onChooseTop: (defId: string) => void;
  onChooseBottom: (defId: string) => void;
  onConfirm: () => void;
  onUseDefaultTop: () => void;
  onUseDefaultBottom: () => void;
  onSetActionOrder: (order: 'top_first' | 'bottom_first') => void;
  onGoBack?: () => void;
}

function ActionSummary({ action }: { action: AbilityAction }) {
  switch (action.type) {
    case 'attack':
      return (
        <span className="flex items-center gap-0.5">
          <ActionIcon icon="attack" size={12} />
          <span className="font-bold">{action.value}</span>
          {action.range && <><ActionIcon icon="range" size={10} /><span>{action.range}</span></>}
          {action.target && action.target > 1 && <span className="opacity-70">x{action.target}</span>}
          {action.piercing && <><ActionIcon icon="pierce" size={10} /><span>{action.piercing}</span></>}
        </span>
      );
    case 'move':
      return (
        <span className="flex items-center gap-0.5">
          <ActionIcon icon="move" size={12} />
          <span className="font-bold">{action.value}</span>
          {action.jump && <ActionIcon icon="jump" size={10} />}
        </span>
      );
    case 'heal':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="heal" size={12} color="#3a9e3a" /><span className="font-bold">{action.value}</span></span>;
    case 'shield':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="shield" size={12} color="#4a9eff" /><span className="font-bold">{action.value}</span></span>;
    case 'push':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="push" size={10} /><span>{action.value}</span></span>;
    case 'pull':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="pull" size={10} /><span>{action.value}</span></span>;
    case 'retaliate':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="retaliate" size={12} /><span className="font-bold">{action.value}</span></span>;
    case 'condition':
      return <span className="flex items-center gap-0.5"><ActionIcon icon={action.condition ?? 'wound'} size={10} /><span>{t(`condition.${action.condition}`)}</span></span>;
    default:
      return <span>{action.type} {action.value}</span>;
  }
}

export function CardSelector({
  selectedCards, cardDefs, cardStates,
  topCardId, bottomCardId, actionOrder,
  onChooseTop, onChooseBottom, onConfirm,
  onUseDefaultTop, onUseDefaultBottom, onSetActionOrder, onGoBack,
}: CardSelectorProps) {
  const isAssigned = topCardId && bottomCardId;

  return (
    <div className="rounded-lg p-5 card-enter" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-gold-dim)', boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}>
      <h3 className="text-sm font-semibold mb-4 text-center" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
        {t('assign_actions')}
      </h3>

      {/* Two cards side by side */}
      <div className="flex gap-4 justify-center mb-4">
        {selectedCards.filter(Boolean).map(defId => {
          const def = cardDefs.find(d => d.id === defId);
          const cs = cardStates.find(s => s.defId === defId);
          if (!def || !cs) return null;
          const sideData = cs.currentSide === 'A' ? def.sideA : def.sideB;
          const isTopAssigned = topCardId === defId;
          const isBottomAssigned = bottomCardId === defId;

          return (
            <div key={defId} style={{ width: '220px' }}>
              {/* Card header */}
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
                  {def.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white" style={{ background: cs.currentSide === 'A' ? 'var(--color-side-a)' : 'var(--color-side-b)' }}>
                  {cs.currentSide}
                </span>
              </div>

              {/* TOP zone */}
              <div
                onClick={() => onChooseTop(defId)}
                className="rounded-t-lg p-3 transition-all cursor-pointer"
                style={{
                  background: isTopAssigned ? 'rgba(196,165,90,0.15)' : 'var(--color-bg-card)',
                  border: isTopAssigned ? '2px solid var(--color-gold)' : '2px solid var(--color-bg-card-hover)',
                  borderBottom: 'none',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-muted)' }}>{t('top')}</span>
                  {isTopAssigned && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--color-gold)', color: 'var(--color-bg-primary)' }}>
                      {t('assigned')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  {sideData.top.actions.map((a, i) => <ActionSummary key={i} action={a} />)}
                  {sideData.top.isLost && <span className="text-[9px] font-bold" style={{ color: 'var(--color-blood-red-bright)' }}>PERDU</span>}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--color-gold-dim)' }} />

              {/* BOTTOM zone */}
              <div
                onClick={() => onChooseBottom(defId)}
                className="rounded-b-lg p-3 transition-all cursor-pointer"
                style={{
                  background: isBottomAssigned ? 'rgba(196,165,90,0.15)' : 'var(--color-bg-card)',
                  border: isBottomAssigned ? '2px solid var(--color-gold)' : '2px solid var(--color-bg-card-hover)',
                  borderTop: 'none',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-text-muted)' }}>{t('bottom')}</span>
                  {isBottomAssigned && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--color-gold)', color: 'var(--color-bg-primary)' }}>
                      {t('assigned')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  {sideData.bottom.actions.map((a, i) => <ActionSummary key={i} action={a} />)}
                  {sideData.bottom.isLost && <span className="text-[9px] font-bold" style={{ color: 'var(--color-blood-red-bright)' }}>PERDU</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Default action mini-cards */}
      <div className="flex gap-2 justify-center mb-4">
        <button
          onClick={onUseDefaultTop}
          className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-colors"
          style={{
            background: topCardId === '__default_top__' ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
            color: topCardId === '__default_top__' ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
            border: topCardId === '__default_top__' ? '1px solid var(--color-gold-bright)' : '1px solid var(--color-bg-card-hover)',
          }}
        >
          <ActionIcon icon="attack" size={12} />
          {t('default_atk')}
        </button>
        <button
          onClick={onUseDefaultBottom}
          className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-colors"
          style={{
            background: bottomCardId === '__default_bottom__' ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
            color: bottomCardId === '__default_bottom__' ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
            border: bottomCardId === '__default_bottom__' ? '1px solid var(--color-gold-bright)' : '1px solid var(--color-bg-card-hover)',
          }}
        >
          <ActionIcon icon="move" size={12} />
          {t('default_move')}
        </button>
      </div>

      {/* Execution order toggle */}
      {isAssigned && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider mb-1 text-center" style={{ color: 'var(--color-text-muted)' }}>
            {t('execution_order')}
          </div>
          <div className="flex gap-1.5 justify-center">
            <button
              onClick={() => onSetActionOrder('top_first')}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              style={{
                background: actionOrder === 'top_first' ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
                color: actionOrder === 'top_first' ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {t('top_first')}
            </button>
            <button
              onClick={() => onSetActionOrder('bottom_first')}
              className="px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              style={{
                background: actionOrder === 'bottom_first' ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
                color: actionOrder === 'bottom_first' ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
              }}
            >
              {t('bottom_first')}
            </button>
          </div>
        </div>
      )}

      {/* Confirm + Back */}
      <div className="flex gap-2">
        {onGoBack && (
          <button onClick={onGoBack} className="btn-secondary text-xs px-3 py-2">
            {t('back')}
          </button>
        )}
        {isAssigned && (
          <button onClick={onConfirm} className="btn-primary btn-confirm flex-1">
            {t('execute_actions')}
          </button>
        )}
      </div>
    </div>
  );
}
