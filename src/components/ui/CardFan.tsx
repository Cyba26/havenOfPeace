'use client';
import React, { useState } from 'react';
import type { AbilityCardDef, CardState, AbilityAction } from '@/types/cards';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { t } from '@/i18n';

interface CardFanProps {
  cardDefs: AbilityCardDef[];
  cardStates: CardState[];
  selectedCards: [string, string] | null;
  initiativeCard: string | null;
  onSelectCard: (defId: string) => void;
  onDeselectCard: (defId: string) => void;
  onSetInitiative: (defId: string) => void;
}

function ActionSummary({ action }: { action: AbilityAction }) {
  switch (action.type) {
    case 'attack':
      return (
        <span className="flex items-center gap-0.5">
          <ActionIcon icon="attack" size={11} />
          <span>{action.value}</span>
          {action.range && <><ActionIcon icon="range" size={9} /><span>{action.range}</span></>}
          {action.target && action.target > 1 && <><ActionIcon icon="target" size={9} /><span>x{action.target}</span></>}
          {action.piercing && <><ActionIcon icon="pierce" size={9} /><span>{action.piercing}</span></>}
        </span>
      );
    case 'move':
      return (
        <span className="flex items-center gap-0.5">
          <ActionIcon icon="move" size={11} />
          <span>{action.value}</span>
          {action.jump && <ActionIcon icon="jump" size={9} />}
        </span>
      );
    case 'heal':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="heal" size={11} color="#3a9e3a" /><span>{action.value}</span></span>;
    case 'shield':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="shield" size={11} color="#4a9eff" /><span>{action.value}</span></span>;
    case 'push':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="push" size={10} /><span>{action.value}</span></span>;
    case 'pull':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="pull" size={10} /><span>{action.value}</span></span>;
    case 'retaliate':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="retaliate" size={11} /><span>{action.value}</span></span>;
    case 'condition':
      return <span className="flex items-center gap-0.5"><ActionIcon icon={action.condition ?? 'wound'} size={10} /><span className="capitalize">{t(`condition.${action.condition}`)}</span></span>;
    default:
      return <span>{action.type} {action.value}</span>;
  }
}

function ActionsRow({ actions, isLost }: { actions: AbilityAction[]; isLost: boolean }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {actions.map((a, i) => (
        <ActionSummary key={i} action={a} />
      ))}
      {isLost && <span className="text-[8px]" style={{ color: 'var(--color-blood-red-bright)' }}>PERDU</span>}
    </div>
  );
}

export function CardFan({
  cardDefs, cardStates, selectedCards, initiativeCard,
  onSelectCard, onDeselectCard, onSetInitiative,
}: CardFanProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handCards = cardStates.filter(cs => cs.location === 'hand');
  if (handCards.length === 0) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
        {t('no_cards')}
      </div>
    );
  }

  const count = handCards.length;
  const maxSpread = 40; // max total arc degrees
  const spreadAngle = Math.min(maxSpread, count * 6);
  const selectionFull = selectedCards?.[0] && selectedCards?.[1];

  return (
    <div className="relative flex justify-center items-end" style={{ minHeight: '280px', perspective: '800px' }}>
      {handCards.map((cs, i) => {
        const def = cardDefs.find(d => d.id === cs.defId);
        if (!def) return null;

        const isSelected = selectedCards?.[0] === cs.defId || selectedCards?.[1] === cs.defId;
        const isInit = initiativeCard === cs.defId;
        const isHovered = hoveredId === cs.defId;
        const side = cs.currentSide;
        const sideData = side === 'A' ? def.sideA : def.sideB;
        const cardName = t(`card.${def.id.replace('bruiser-0', '').replace('bruiser-', '')}`) !== `card.${def.id.replace('bruiser-0', '').replace('bruiser-', '')}` ? t(`card.${def.id.replace('bruiser-0', '').replace('bruiser-', '')}`) : def.name;

        // Fan positioning
        const centerIndex = (count - 1) / 2;
        const offset = i - centerIndex;
        const angle = (spreadAngle / Math.max(count - 1, 1)) * offset;
        const translateX = offset * 70;
        const translateY = Math.abs(offset) * 8;

        const transform = isHovered
          ? `translateX(${translateX}px) translateY(-40px) rotate(0deg)`
          : isSelected
          ? `translateX(${translateX}px) translateY(${translateY - 20}px) rotate(${angle}deg)`
          : `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg)`;

        return (
          <div
            key={cs.defId}
            className="absolute cursor-pointer"
            style={{
              width: '140px',
              transform,
              transformOrigin: 'bottom center',
              transition: 'transform 0.25s ease, box-shadow 0.2s ease',
              zIndex: isHovered ? 50 : isSelected ? 40 : 10 + i,
            }}
            onMouseEnter={() => setHoveredId(cs.defId)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              if (isSelected) {
                onDeselectCard(cs.defId);
              } else if (!selectionFull) {
                onSelectCard(cs.defId);
              }
            }}
          >
            <div
              className="rounded-lg p-2 flex flex-col gap-1"
              style={{
                background: 'var(--color-bg-card)',
                border: `2px solid ${isSelected ? 'var(--color-gold-bright)' : 'var(--color-gold-dim)'}`,
                borderLeft: `4px solid ${side === 'A' ? 'var(--color-side-a)' : 'var(--color-side-b)'}`,
                boxShadow: isSelected
                  ? '0 0 20px rgba(196, 165, 90, 0.4)'
                  : isHovered
                  ? '0 8px 24px rgba(0,0,0,0.6)'
                  : '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold truncate" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
                  {cardName}
                </span>
                <span className="text-[9px] px-1 rounded font-bold text-white"
                  style={{ background: side === 'A' ? 'var(--color-side-a)' : 'var(--color-side-b)' }}>
                  {side}
                </span>
              </div>

              {/* Initiative */}
              <div className="text-center text-lg font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {sideData.initiative}
              </div>

              {/* Top */}
              <div className="text-[9px]" style={{ borderTop: '1px solid var(--color-gold-dim)', paddingTop: '2px' }}>
                <span className="uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', fontSize: '7px' }}>{t('top')}</span>
                <ActionsRow actions={sideData.top.actions} isLost={sideData.top.isLost} />
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px dashed var(--color-text-muted)' }} />

              {/* Bottom */}
              <div className="text-[9px]">
                <span className="uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', fontSize: '7px' }}>{t('bottom')}</span>
                <ActionsRow actions={sideData.bottom.actions} isLost={sideData.bottom.isLost} />
              </div>

              {/* Initiative selector */}
              {isSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSetInitiative(cs.defId); }}
                  className="text-[9px] mt-0.5 py-0.5 rounded transition-colors"
                  style={{
                    background: isInit ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
                    color: isInit ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  {isInit ? t('init_badge') : 'Initiative'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
