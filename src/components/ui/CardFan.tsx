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
  onConfirm?: () => void;
  canConfirm?: boolean;
  canRest?: boolean;
  onLongRest?: () => void;
}

function ActionSummary({ action, size = 13 }: { action: AbilityAction; size?: number }) {
  const s = size;
  const sSmall = Math.round(s * 0.85);
  switch (action.type) {
    case 'attack':
      return (
        <span className="flex items-center gap-0.5">
          <ActionIcon icon="attack" size={s} />
          <span className="font-bold">{action.value}</span>
          {action.range && <><ActionIcon icon="range" size={sSmall} /><span>{action.range}</span></>}
          {action.target && action.target > 1 && <span className="text-[9px] opacity-70">x{action.target}</span>}
          {action.piercing && <><ActionIcon icon="pierce" size={sSmall} /><span>{action.piercing}</span></>}
        </span>
      );
    case 'move':
      return (
        <span className="flex items-center gap-0.5">
          <ActionIcon icon="move" size={s} />
          <span className="font-bold">{action.value}</span>
          {action.jump && <ActionIcon icon="jump" size={sSmall} />}
        </span>
      );
    case 'heal':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="heal" size={s} color="#3a9e3a" /><span className="font-bold">{action.value}</span></span>;
    case 'shield':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="shield" size={s} color="#4a9eff" /><span className="font-bold">{action.value}</span></span>;
    case 'push':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="push" size={sSmall} /><span>{action.value}</span></span>;
    case 'pull':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="pull" size={sSmall} /><span>{action.value}</span></span>;
    case 'retaliate':
      return <span className="flex items-center gap-0.5"><ActionIcon icon="retaliate" size={s} /><span className="font-bold">{action.value}</span></span>;
    case 'condition':
      return <span className="flex items-center gap-0.5"><ActionIcon icon={action.condition ?? 'wound'} size={sSmall} /><span>{t(`condition.${action.condition}`)}</span></span>;
    default:
      return <span>{action.type} {action.value}</span>;
  }
}

function ActionsRow({ actions, isLost }: { actions: AbilityAction[]; isLost: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((a, i) => (
        <ActionSummary key={i} action={a} />
      ))}
      {isLost && <span className="text-[9px] font-bold" style={{ color: 'var(--color-blood-red-bright)' }}>PERDU</span>}
    </div>
  );
}

/** Build a tooltip string for a card action */
function actionTooltip(action: AbilityAction): string {
  const parts: string[] = [];
  switch (action.type) {
    case 'attack':
      parts.push(`${t('action.attack')} ${action.value}`);
      if (action.range) parts.push(`${t('action.range')} ${action.range}`);
      if (action.target && action.target > 1) parts.push(`${action.target} ${t('action.target')}`);
      if (action.piercing) parts.push(`${t('action.pierce')} ${action.piercing}`);
      break;
    case 'move':
      parts.push(`${t('action.move')} ${action.value}`);
      if (action.jump) parts.push(t('action.jump'));
      break;
    case 'heal': parts.push(`${t('action.heal')} ${action.value}`); break;
    case 'shield': parts.push(`${t('action.shield')} ${action.value}`); break;
    case 'push': parts.push(`${t('action.push')} ${action.value}`); break;
    case 'pull': parts.push(`${t('action.pull')} ${action.value}`); break;
    case 'retaliate': parts.push(`${t('action.retaliate')} ${action.value}`); break;
    case 'condition': parts.push(t(`condition.${action.condition}`)); break;
    default: parts.push(`${action.type} ${action.value ?? ''}`);
  }
  return parts.join(', ');
}

function cardTooltip(def: AbilityCardDef, side: 'A' | 'B'): string {
  const sideData = side === 'A' ? def.sideA : def.sideB;
  const top = sideData.top.actions.map(actionTooltip).join(' + ');
  const bot = sideData.bottom.actions.map(actionTooltip).join(' + ');
  return `${def.name} (${side}) — Init ${sideData.initiative}\n${t('top')}: ${top}${sideData.top.isLost ? ' [PERDU]' : ''}\n${t('bottom')}: ${bot}${sideData.bottom.isLost ? ' [PERDU]' : ''}`;
}

// Card background illustration based on main action
const CARD_BG_ICON: Record<string, string> = {
  attack: 'attack', move: 'move', heal: 'heal', shield: 'shield', retaliate: 'retaliate',
};

export function CardFan({
  cardDefs, cardStates, selectedCards, initiativeCard,
  onSelectCard, onDeselectCard, onSetInitiative,
  onConfirm, canConfirm, canRest, onLongRest,
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
  const maxSpread = 50;
  const spreadAngle = Math.min(maxSpread, count * 7);
  const selectionFull = selectedCards?.[0] && selectedCards?.[1];
  const hoveredIndex = hoveredId ? handCards.findIndex(c => c.defId === hoveredId) : -1;
  const spacing = count <= 6 ? 85 : Math.max(60, 500 / count);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Confirm / Rest buttons ABOVE cards */}
      <div className="flex gap-3 items-center" style={{ minHeight: '36px' }}>
        {onConfirm && canConfirm && (
          <button onClick={onConfirm} className="btn-primary px-8 py-2 text-sm">
            {t('confirm_selection')}
          </button>
        )}
        {canRest && onLongRest && (
          <button onClick={onLongRest} className="btn-secondary text-xs px-4 py-2">
            <span className="flex items-center gap-1">
              <ActionIcon icon="heal" size={12} color="var(--color-health-green-bright)" />
              {t('long_rest')}
            </span>
          </button>
        )}
      </div>

      {/* Card fan */}
      <div className="relative flex justify-center items-end" style={{ minHeight: '280px', perspective: '800px' }}>
        {handCards.map((cs, i) => {
          const def = cardDefs.find(d => d.id === cs.defId);
          if (!def) return null;

          const isSelected = selectedCards?.[0] === cs.defId || selectedCards?.[1] === cs.defId;
          const isInit = initiativeCard === cs.defId;
          const isHovered = hoveredId === cs.defId;
          const side = cs.currentSide;
          const sideData = side === 'A' ? def.sideA : def.sideB;
          const mainAction = sideData.top.actions[0]?.type ?? 'attack';
          const bgIcon = CARD_BG_ICON[mainAction] || 'attack';

          // Fan positioning
          const centerIndex = (count - 1) / 2;
          const offset = i - centerIndex;
          const angle = (spreadAngle / Math.max(count - 1, 1)) * offset;
          const baseX = offset * spacing;
          const translateY = Math.abs(offset) * 10;

          // Push adjacent cards apart on hover
          let pushOffset = 0;
          if (hoveredIndex !== -1 && i !== hoveredIndex) {
            if (i < hoveredIndex) pushOffset = -30;
            if (i > hoveredIndex) pushOffset = 30;
          }
          const translateX = baseX + pushOffset;

          const transform = isHovered
            ? `translateX(${baseX}px) translateY(-50px) rotate(0deg) scale(1.08)`
            : isSelected
            ? `translateX(${translateX}px) translateY(${translateY - 25}px) rotate(${angle}deg)`
            : `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg)`;

          return (
            <div
              key={cs.defId}
              className="absolute cursor-pointer"
              style={{
                width: '170px',
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
              title={cardTooltip(def, side)}
            >
              <div
                className="rounded-lg p-3 flex flex-col gap-1.5 relative overflow-hidden"
                style={{
                  background: 'var(--color-bg-card)',
                  border: `2px solid ${isSelected ? 'var(--color-gold-bright)' : 'var(--color-gold-dim)'}`,
                  borderLeft: `4px solid ${side === 'A' ? 'var(--color-side-a)' : 'var(--color-side-b)'}`,
                  boxShadow: isSelected
                    ? '0 0 24px rgba(196, 165, 90, 0.5)'
                    : isHovered
                    ? '0 12px 32px rgba(0,0,0,0.7)'
                    : '0 4px 16px rgba(0,0,0,0.5)',
                }}
              >
                {/* Background illustration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
                  <ActionIcon icon={bgIcon as any} size={100} />
                </div>

                {/* Header */}
                <div className="flex justify-between items-center relative">
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
                    {def.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {isInit && (
                      <span className="text-[8px] px-1 rounded font-bold" style={{ background: 'var(--color-gold)', color: 'var(--color-bg-primary)' }}>
                        INIT
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white"
                      style={{ background: side === 'A' ? 'var(--color-side-a)' : 'var(--color-side-b)' }}>
                      {side}
                    </span>
                  </div>
                </div>

                {/* Initiative */}
                <div className="text-center text-xl font-bold relative" style={{ color: 'var(--color-text-secondary)' }}>
                  {sideData.initiative}
                </div>

                {/* Top */}
                <div className="text-[11px] relative" style={{ borderTop: '1px solid var(--color-gold-dim)', paddingTop: '4px' }}>
                  <span className="uppercase tracking-wider block mb-0.5" style={{ color: 'var(--color-text-muted)', fontSize: '8px' }}>{t('top')}</span>
                  <ActionsRow actions={sideData.top.actions} isLost={sideData.top.isLost} />
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px dashed var(--color-text-muted)' }} />

                {/* Bottom */}
                <div className="text-[11px] relative">
                  <span className="uppercase tracking-wider block mb-0.5" style={{ color: 'var(--color-text-muted)', fontSize: '8px' }}>{t('bottom')}</span>
                  <ActionsRow actions={sideData.bottom.actions} isLost={sideData.bottom.isLost} />
                </div>

                {/* Lvl badge */}
                <div className="absolute bottom-1 right-1 text-[7px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                  Nv.{def.level}
                </div>

                {/* Initiative selector */}
                {isSelected && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetInitiative(cs.defId); }}
                    className="text-[10px] mt-1 py-1 rounded transition-colors font-semibold relative"
                    style={{
                      background: isInit ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
                      color: isInit ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {isInit ? 'Carte d\'initiative' : 'Choisir comme initiative'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
