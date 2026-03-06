'use client';
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { HexGrid } from '@/components/board/HexGrid';
import { CardFan } from '@/components/ui/CardFan';
import { CardSelector } from '@/components/cards/CardSelector';
import { SelectedCardsSummary } from '@/components/ui/SelectedCardsSummary';
import { GameLog } from '@/components/ui/GameLog';
import { StatusBar } from '@/components/ui/StatusBar';
import { ElementTracker } from '@/components/ui/ElementTracker';
import { DamageNegation } from '@/components/ui/DamageNegation';
import { Inventory } from '@/components/ui/Inventory';
import { PhaseAnnouncement } from '@/components/ui/PhaseAnnouncement';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { canRest, getDiscardedCards } from '@/engine/cards';
import { MONSTER_DEFS, SCENARIOS } from '@/data/index';
import { t } from '@/i18n';

export default function GamePage() {
  const store = useGameStore();
  const {
    phase, playerTurnSubPhase, round, hexMap, character,
    monsters, reachableHexes, validAttackTargets, log, infusedElements,
    pendingDamage, pendingDamageSource, shortRestLostCardId, shortRestRerolled,
    initScenario, selectCard, deselectCard, setInitiativeCard,
    confirmCardSelection, chooseTopCard, chooseBottomCard,
    useDefaultAction, confirmActionChoice, selectMoveHex,
    selectAttackTarget, endPlayerTurn, executeMonsterPhase,
    endRound, performShortRestAction, shortRestRerollAction,
    acceptDamage, negateDamageDiscardA, negateDamageDiscard2B, negateDamageLoseCard,
    declareLongRest, confirmLongRestLoss,
    useItem, resetGame,
  } = store;

  const handCount = character.cards.filter(c => c.location === 'hand').length;
  const discardCount = character.cards.filter(c => c.location === 'discard').length;
  const lostCount = character.cards.filter(c => c.location === 'lost').length;

  // ─── Scenario Setup ───────────────────────────────────────────
  if (phase === 'SCENARIO_SETUP') {
    const scenarioList = Object.values(SCENARIOS);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-gold)' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm max-w-md text-center">
          {t('subtitle')}
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          {scenarioList.map((sc, i) => (
            <div key={sc.id} className="rounded-lg p-6 text-center w-64" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-gold-dim)' }}>
              <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-gold)' }}>
                {i + 1}. {sc.name}
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {sc.description}
              </p>
              <div className="text-xs mb-4 flex items-center justify-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                <ActionIcon icon="attack" size={12} />
                <span>{sc.monsters.length} {t('enemies')}</span>
                {sc.monsters.some(m => m.isElite) && (
                  <span className="flex items-center gap-0.5">
                    <ActionIcon icon="crown" size={12} color="var(--color-monster-elite)" />
                    {t('elite')}
                  </span>
                )}
              </div>
              <button onClick={() => initScenario(sc.id)} className="btn-primary text-sm px-6 py-2">
                {t('begin')}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Victory / Defeat ─────────────────────────────────────────
  if (phase === 'SCENARIO_COMPLETE' || phase === 'SCENARIO_FAILED') {
    const isVictory = phase === 'SCENARIO_COMPLETE';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <h1
          className={`text-3xl font-bold ${isVictory ? 'victory-text' : ''}`}
          style={{ fontFamily: 'var(--font-display)', color: isVictory ? 'var(--color-health-green-bright)' : 'var(--color-blood-red-bright)' }}
        >
          {isVictory ? t('victory') : t('defeated')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
          {isVictory ? t('victory_desc') : t('defeat_desc')}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {t('round')} {round} &mdash; {character.currentHP}/{character.maxHP} {t('hp_remaining')}
        </p>
        <div className="rounded-lg p-4 w-full max-w-md" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-gold-dim)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-gold)' }}>{t('battle_log')}</h3>
          <GameLog entries={log} />
        </div>
        <button onClick={resetGame} className="btn-primary px-6 py-2">
          {t('play_again')}
        </button>
      </div>
    );
  }

  // ─── Main Game Layout ─────────────────────────────────────────
  const showCardFan = phase === 'CARD_SELECTION' && pendingDamage === null;
  const showSelectedSummary = (phase === 'PLAYER_TURN' || phase === 'MONSTER_TURN') && character.topCardId && character.bottomCardId;

  return (
    <div className="h-screen flex flex-col">
      <StatusBar
        round={round}
        phase={phase}
        hp={character.currentHP}
        maxHP={character.maxHP}
        handCount={handCount}
        discardCount={discardCount}
        lostCount={lostCount}
      >
        <ElementTracker infusedElements={infusedElements} />
      </StatusBar>

      <PhaseAnnouncement phase={phase} />

      <div className="flex-1 flex min-h-0">
        {/* Left: Game Board */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <HexGrid
              hexMap={hexMap}
              hexSize={50}
              characterPosition={character.position}
              characterHP={character.currentHP}
              characterMaxHP={character.maxHP}
              characterConditions={character.conditions}
              monsters={monsters}
              monsterDefs={MONSTER_DEFS}
              reachableHexes={reachableHexes}
              validAttackTargets={validAttackTargets}
              onHexClick={playerTurnSubPhase === 'SELECTING_MOVE_HEX' ? selectMoveHex : undefined}
              onMonsterClick={playerTurnSubPhase === 'SELECTING_ATTACK_TARGET' ? selectAttackTarget : undefined}
            />
          </div>

          {/* Card Fan at bottom of board area */}
          {showCardFan && (
            <div className="px-4 pb-2">
              <CardFan
                cardDefs={character.cardDefs}
                cardStates={character.cards}
                selectedCards={character.selectedCards}
                initiativeCard={character.initiativeCard}
                onSelectCard={selectCard}
                onDeselectCard={deselectCard}
                onSetInitiative={setInitiativeCard}
              />
            </div>
          )}
        </div>

        {/* Right: Controls Panel */}
        <div
          className="w-80 flex flex-col border-l overflow-y-auto"
          style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-gold-dim)' }}
        >
          <div className="flex-1 p-3 flex flex-col gap-3">
            {/* Damage Negation (overlay when pending) */}
            {pendingDamage !== null && (
              <DamageNegation
                damage={pendingDamage}
                source={pendingDamageSource}
                cards={character.cards}
                cardDefs={character.cardDefs}
                selectedCardIds={character.selectedCards ? [character.selectedCards[0], character.selectedCards[1]].filter(Boolean) : []}
                onAccept={acceptDamage}
                onDiscardA={negateDamageDiscardA}
                onDiscard2B={negateDamageDiscard2B}
                onLoseCard={negateDamageLoseCard}
              />
            )}

            {/* Phase-specific controls */}
            {pendingDamage === null && (
              <PhaseControls
                phase={phase}
                playerTurnSubPhase={playerTurnSubPhase}
                character={character}
                round={round}
                shortRestLostCardId={shortRestLostCardId}
                shortRestRerolled={shortRestRerolled}
                confirmCardSelection={confirmCardSelection}
                chooseTopCard={chooseTopCard}
                chooseBottomCard={chooseBottomCard}
                useDefaultAction={useDefaultAction}
                confirmActionChoice={confirmActionChoice}
                endPlayerTurn={endPlayerTurn}
                executeMonsterPhase={executeMonsterPhase}
                endRound={endRound}
                performShortRestAction={performShortRestAction}
                shortRestRerollAction={shortRestRerollAction}
                declareLongRest={declareLongRest}
                confirmLongRestLoss={confirmLongRestLoss}
              />
            )}

            {/* Selected Cards Summary (during player/monster turn) */}
            {showSelectedSummary && pendingDamage === null && character.selectedCards && (
              <SelectedCardsSummary
                selectedCards={character.selectedCards}
                cardDefs={character.cardDefs}
                cardStates={character.cards}
                topCardId={character.topCardId}
                bottomCardId={character.bottomCardId}
              />
            )}

            {/* Inventory */}
            {pendingDamage === null && character.items.length > 0 && (
              <Inventory
                itemDefs={character.itemDefs}
                items={character.items}
                onUseItem={useItem}
                disabled={phase !== 'PLAYER_TURN'}
              />
            )}
          </div>

          {/* Game Log */}
          <div className="border-t" style={{ borderColor: 'var(--color-gold-dim)' }}>
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              {t('battle_log')}
            </div>
            <GameLog entries={log} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phase Controls ───────────────────────────────────────────────

interface PhaseControlsProps {
  phase: string;
  playerTurnSubPhase: string | null;
  character: ReturnType<typeof useGameStore.getState>['character'];
  round: number;
  shortRestLostCardId: string | null;
  shortRestRerolled: boolean;
  confirmCardSelection: () => void;
  chooseTopCard: (defId: string) => void;
  chooseBottomCard: (defId: string) => void;
  useDefaultAction: (half: 'top' | 'bottom') => void;
  confirmActionChoice: () => void;
  endPlayerTurn: () => void;
  executeMonsterPhase: () => void;
  endRound: () => void;
  performShortRestAction: () => void;
  shortRestRerollAction: () => void;
  declareLongRest: () => void;
  confirmLongRestLoss: (cardDefId: string) => void;
}

function PhaseControls({
  phase, playerTurnSubPhase, character, round,
  shortRestLostCardId, shortRestRerolled,
  confirmCardSelection,
  chooseTopCard, chooseBottomCard, useDefaultAction, confirmActionChoice,
  endPlayerTurn, executeMonsterPhase, endRound, performShortRestAction,
  shortRestRerollAction, declareLongRest, confirmLongRestLoss,
}: PhaseControlsProps) {

  // ─── Card Selection Phase ────
  if (phase === 'CARD_SELECTION') {
    const canConfirm = character.selectedCards?.[0] && character.selectedCards?.[1] && character.initiativeCard;
    const canDoRest = canRest(character.cards);

    return (
      <>
        <div className="text-xs font-semibold" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
          {t('select_cards')}
        </div>
        <div className="flex gap-2">
          <button
            onClick={confirmCardSelection}
            disabled={!canConfirm}
            className="btn-primary flex-1"
          >
            {t('confirm_selection')}
          </button>
        </div>
        {canDoRest && (
          <div className="flex gap-2">
            <button onClick={declareLongRest} className="btn-secondary text-xs flex-1">
              {t('long_rest')}
            </button>
          </div>
        )}
      </>
    );
  }

  // ─── Player Turn ────
  if (phase === 'PLAYER_TURN') {
    if (playerTurnSubPhase === 'CHOOSING_ACTION' && character.selectedCards) {
      return (
        <>
          <div className="text-xs font-semibold" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
            {t('assign_actions')}
          </div>
          <CardSelector
            selectedCards={character.selectedCards}
            cardDefs={character.cardDefs}
            cardStates={character.cards}
            topCardId={character.topCardId}
            bottomCardId={character.bottomCardId}
            onChooseTop={chooseTopCard}
            onChooseBottom={chooseBottomCard}
            onConfirm={confirmActionChoice}
            onUseDefaultTop={() => useDefaultAction('top')}
            onUseDefaultBottom={() => useDefaultAction('bottom')}
          />
        </>
      );
    }

    if (playerTurnSubPhase === 'SELECTING_MOVE_HEX') {
      return (
        <div className="text-center py-4">
          <div className="text-xs font-semibold mb-2 flex items-center justify-center gap-1" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
            <ActionIcon icon="move" size={14} />
            {t('select_destination')}
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {t('select_destination_hint')}
          </p>
        </div>
      );
    }

    if (playerTurnSubPhase === 'SELECTING_ATTACK_TARGET') {
      return (
        <div className="text-center py-4">
          <div className="text-xs font-semibold mb-2 flex items-center justify-center gap-1" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
            <ActionIcon icon="attack" size={14} />
            {t('select_target')}
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {t('select_target_hint')}
          </p>
        </div>
      );
    }

    if (playerTurnSubPhase === 'TURN_COMPLETE') {
      return (
        <div className="text-center py-4">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
            {t('turn_complete')}
          </div>
          <button onClick={endPlayerTurn} className="btn-primary">
            {t('end_turn')}
          </button>
        </div>
      );
    }

    return (
      <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
        <div className="text-xs">{t('executing')}</div>
      </div>
    );
  }

  // ─── Monster Turn ────
  if (phase === 'MONSTER_TURN') {
    return (
      <div className="text-center py-4">
        <div className="text-xs font-semibold mb-2 flex items-center justify-center gap-1" style={{ color: 'var(--color-blood-red-bright)', fontFamily: 'var(--font-display)' }}>
          <ActionIcon icon="attack" size={14} color="var(--color-blood-red-bright)" />
          {t('monster_turn')}
        </div>
        <button onClick={executeMonsterPhase} className="btn-secondary">
          {t('execute_monster')}
        </button>
      </div>
    );
  }

  // ─── Resting (Long Rest) ────
  if (phase === 'RESTING') {
    const discardedCards = getDiscardedCards(character.cards);
    const handCards = character.cards.filter(c => c.location === 'hand');
    const recoveredCards = [...discardedCards, ...handCards];

    return (
      <div className="text-center py-4 flex flex-col gap-3">
        <div className="text-xs font-semibold flex items-center justify-center gap-1" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
          <ActionIcon icon="heal" size={14} color="var(--color-health-green-bright)" />
          {t('long_rest_choose')}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {t('long_rest_desc')}
        </p>
        <div className="flex flex-col gap-1">
          {recoveredCards.map(c => {
            const def = character.cardDefs.find(d => d.id === c.defId);
            return (
              <button
                key={c.defId}
                onClick={() => confirmLongRestLoss(c.defId)}
                className="btn-secondary text-xs"
              >
                {def?.name ?? c.defId} ({c.currentSide})
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── End of Round ────
  if (phase === 'END_OF_ROUND') {
    const canDoRest = canRest(character.cards);
    return (
      <div className="text-center py-4 flex flex-col gap-3">
        <div className="text-xs font-semibold" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
          {t('end_of_round')} {round}
        </div>
        {canDoRest && (
          <button onClick={performShortRestAction} className="btn-secondary text-xs">
            {t('short_rest')}
          </button>
        )}
        {shortRestLostCardId && !shortRestRerolled && (
          <div className="text-xs p-2 rounded" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
            {t('lost')} : {character.cardDefs.find(d => d.id === shortRestLostCardId)?.name ?? shortRestLostCardId}
            <button onClick={shortRestRerollAction} className="btn-secondary text-xs ml-2">
              {t('reroll')}
            </button>
          </div>
        )}
        {shortRestLostCardId && shortRestRerolled && (
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('rerolled')} {character.cardDefs.find(d => d.id === shortRestLostCardId)?.name ?? shortRestLostCardId}
          </div>
        )}
        <button onClick={endRound} className="btn-primary">
          {t('next_round')}
        </button>
      </div>
    );
  }

  return null;
}
