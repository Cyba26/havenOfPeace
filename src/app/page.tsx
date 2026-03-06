'use client';
import React, { useState } from 'react';
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
import { MonsterPanel } from '@/components/ui/MonsterPanel';
import { InitiativeTrack } from '@/components/ui/InitiativeTrack';
import { PhaseAnnouncement } from '@/components/ui/PhaseAnnouncement';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { canRest, getDiscardedCards } from '@/engine/cards';
import { MONSTER_DEFS, SCENARIOS } from '@/data/index';
import { t } from '@/i18n';

export default function GamePage() {
  const store = useGameStore();
  const {
    phase, playerTurnSubPhase, round, hexMap, character,
    monsters, reachableHexes, validAttackTargets, log, infusedElements, turnOrder, currentTurnIndex, attackAnimation,
    pendingDamage, pendingDamageSource, shortRestLostCardId, shortRestRerolled,
    monsterStepQueue, monsterStepIndex, monsterStepPhase, monsterStepLogs, monsterAccumulatedDamage,
    initScenario, selectCard, deselectCard, setInitiativeCard,
    confirmCardSelection, goBackToCardSelection, chooseTopCard, chooseBottomCard,
    useDefaultAction, confirmActionChoice, selectMoveHex,
    selectAttackTarget, endPlayerTurn, executeMonsterPhase, advanceMonsterStep,
    endRound, performShortRestAction, shortRestRerollAction,
    acceptDamage, negateDamageDiscardA, negateDamageDiscard2B, negateDamageLoseCard,
    declareLongRest, confirmLongRestLoss,
    useItem, resetGame,
  } = store;

  const [showInventory, setShowInventory] = useState(false);
  const [showLog, setShowLog] = useState(false);

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

  // ─── Main Game Layout (no sidebar) ─────────────────────────────
  const showCardFan = phase === 'CARD_SELECTION' && pendingDamage === null;
  const showActionChoice = phase === 'PLAYER_TURN' && playerTurnSubPhase === 'CHOOSING_ACTION' && character.selectedCards && pendingDamage === null;
  const showSelectedSummary = (phase === 'PLAYER_TURN' || phase === 'MONSTER_TURN') && character.topCardId && character.bottomCardId && pendingDamage === null;
  const canConfirmCards = !!(character.selectedCards?.[0] && character.selectedCards?.[1] && character.initiativeCard);
  const canDoRest = canRest(character.cards);
  const isPlayerTurnActive = phase === 'PLAYER_TURN';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ─── Top Bar ─── */}
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

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Monster panel */}
          <div className="relative">
            <MonsterPanel monsters={monsters} monsterDefs={MONSTER_DEFS} />
          </div>

          {/* Inventory toggle */}
          {character.items.length > 0 && (
            <button
              onClick={() => setShowInventory(!showInventory)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: showInventory ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-gold-dim)',
                color: showInventory ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
              }}
            >
              <ActionIcon icon="loot" size={12} />
              {t('items')}
            </button>
          )}

          {/* Log toggle */}
          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: showLog ? 'var(--color-gold)' : 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-gold-dim)',
              color: showLog ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)',
            }}
          >
            {t('battle_log')}
          </button>
        </div>
      </StatusBar>

      <PhaseAnnouncement phase={phase} />

      {/* ─── Main Area ─── */}
      <div className="flex-1 relative min-h-0">
        {/* Hex Grid — full width */}
        <div className="absolute inset-0 flex items-center justify-center">
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
            attackAnimation={attackAnimation}
          />
        </div>

        {/* ─── Initiative Track (top center) ─── */}
        {turnOrder.length > 0 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2" style={{ zIndex: 55 }}>
            <InitiativeTrack turnOrder={turnOrder} currentTurnIndex={currentTurnIndex} />
          </div>
        )}

        {/* ─── Inventory overlay (top right) ─── */}
        {showInventory && (
          <div
            className="absolute top-2 right-2 w-72 rounded-lg p-3 overflow-y-auto"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-gold-dim)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              zIndex: 70,
              maxHeight: '60vh',
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
                {t('items')}
              </span>
              <button onClick={() => setShowInventory(false)} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                ✕
              </button>
            </div>
            <Inventory
              itemDefs={character.itemDefs}
              items={character.items}
              onUseItem={useItem}
              disabled={!isPlayerTurnActive}
            />
          </div>
        )}

        {/* ─── Game Log overlay (top right, below inventory) ─── */}
        {showLog && (
          <div
            className="absolute top-2 left-2 w-80 rounded-lg overflow-hidden"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-gold-dim)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              zIndex: 70,
              maxHeight: '50vh',
            }}
          >
            <div className="flex justify-between items-center px-3 py-1.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
                {t('battle_log')}
              </span>
              <button onClick={() => setShowLog(false)} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                ✕
              </button>
            </div>
            <GameLog entries={log} />
          </div>
        )}

        {/* ─── Selected Cards Summary (floating, bottom-left) ─── */}
        {showSelectedSummary && character.selectedCards && (
          <div className="absolute bottom-2 left-2" style={{ zIndex: 60 }}>
            <SelectedCardsSummary
              selectedCards={character.selectedCards}
              cardDefs={character.cardDefs}
              cardStates={character.cards}
              topCardId={character.topCardId}
              bottomCardId={character.bottomCardId}
            />
          </div>
        )}

        {/* ─── Damage Negation overlay (centered) ─── */}
        {pendingDamage !== null && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 90, background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-80">
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
            </div>
          </div>
        )}

        {/* ─── Action Choice overlay (centered) ─── */}
        {showActionChoice && character.selectedCards && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 80, background: 'rgba(0,0,0,0.4)' }}>
            <div className="w-96">
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
                onGoBack={goBackToCardSelection}
              />
            </div>
          </div>
        )}

        {/* ─── Resting overlay (centered) ─── */}
        {phase === 'RESTING' && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 80, background: 'rgba(0,0,0,0.4)' }}>
            <RestingPanel character={character} confirmLongRestLoss={confirmLongRestLoss} />
          </div>
        )}

        {/* ─── Player turn action hints (centered top) ─── */}
        {phase === 'PLAYER_TURN' && playerTurnSubPhase === 'SELECTING_MOVE_HEX' && pendingDamage === null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg" style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid var(--color-gold-dim)', zIndex: 60 }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-gold)' }}>
              <ActionIcon icon="move" size={14} />
              {t('select_destination')}
            </div>
          </div>
        )}
        {phase === 'PLAYER_TURN' && playerTurnSubPhase === 'SELECTING_ATTACK_TARGET' && pendingDamage === null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg" style={{ background: 'rgba(10,10,15,0.85)', border: '1px solid var(--color-blood-red-bright)', zIndex: 60 }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-blood-red-bright)' }}>
              <ActionIcon icon="attack" size={14} color="var(--color-blood-red-bright)" />
              {t('select_target')}
            </div>
          </div>
        )}

        {/* ─── Card Fan floating over the board (no background) ─── */}
        {showCardFan && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 50 }}>
            <div className="pointer-events-auto px-4 pb-2">
              <CardFan
                cardDefs={character.cardDefs}
                cardStates={character.cards}
                selectedCards={character.selectedCards}
                initiativeCard={character.initiativeCard}
                onSelectCard={selectCard}
                onDeselectCard={deselectCard}
                onSetInitiative={setInitiativeCard}
                onConfirm={confirmCardSelection}
                canConfirm={canConfirmCards}
                canRest={canDoRest}
                onLongRest={declareLongRest}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Bar (non-card-fan controls only) ─── */}
      {!showCardFan && (
      <div style={{ background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-gold-dim)' }}>
        {/* Player Turn Complete button */}
        {phase === 'PLAYER_TURN' && playerTurnSubPhase === 'TURN_COMPLETE' && pendingDamage === null && (
          <div className="flex justify-center py-3">
            <button onClick={endPlayerTurn} className="btn-primary px-8 py-2 text-sm">
              {t('end_turn')}
            </button>
          </div>
        )}

        {/* Monster Turn — step-by-step */}
        {phase === 'MONSTER_TURN' && pendingDamage === null && monsterStepPhase === null && (
          <div className="flex justify-center items-center gap-2 py-3">
            <ActionIcon icon="attack" size={14} color="var(--color-blood-red-bright)" />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-blood-red-bright)', fontFamily: 'var(--font-display)' }}>
              {t('monster_turn')}
            </span>
            <button onClick={executeMonsterPhase} className="btn-secondary px-6 py-1.5 text-sm ml-2">
              {t('execute_monster')}
            </button>
          </div>
        )}
        {phase === 'MONSTER_TURN' && pendingDamage === null && monsterStepPhase !== null && (
          <MonsterStepBar
            monsters={monsters}
            monsterDefs={MONSTER_DEFS}
            turnOrder={turnOrder}
            currentTurnIndex={currentTurnIndex}
            monsterStepQueue={monsterStepQueue}
            monsterStepIndex={monsterStepIndex}
            monsterStepPhase={monsterStepPhase}
            monsterStepLogs={monsterStepLogs}
            onAdvance={advanceMonsterStep}
          />
        )}

        {/* End of Round controls */}
        {phase === 'END_OF_ROUND' && (
          <EndOfRoundBar
            round={round}
            character={character}
            shortRestLostCardId={shortRestLostCardId}
            shortRestRerolled={shortRestRerolled}
            performShortRestAction={performShortRestAction}
            shortRestRerollAction={shortRestRerollAction}
            endRound={endRound}
          />
        )}

        {/* Executing actions feedback */}
        {phase === 'PLAYER_TURN' && playerTurnSubPhase !== 'CHOOSING_ACTION' && playerTurnSubPhase !== 'TURN_COMPLETE'
          && playerTurnSubPhase !== 'SELECTING_MOVE_HEX' && playerTurnSubPhase !== 'SELECTING_ATTACK_TARGET'
          && pendingDamage === null && (
          <div className="text-center py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {t('executing')}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function RestingPanel({ character, confirmLongRestLoss }: {
  character: ReturnType<typeof useGameStore.getState>['character'];
  confirmLongRestLoss: (cardDefId: string) => void;
}) {
  const discardedCards = getDiscardedCards(character.cards);
  const handCards = character.cards.filter(c => c.location === 'hand');
  const recoveredCards = [...discardedCards, ...handCards];

  return (
    <div className="w-80 rounded-lg p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-gold-dim)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <div className="text-sm font-semibold mb-2 flex items-center justify-center gap-1.5" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
        <ActionIcon icon="heal" size={16} color="var(--color-health-green-bright)" />
        {t('long_rest_choose')}
      </div>
      <p className="text-xs mb-3 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        {t('long_rest_desc')}
      </p>
      <div className="flex flex-col gap-1.5">
        {recoveredCards.map(c => {
          const def = character.cardDefs.find(d => d.id === c.defId);
          return (
            <button
              key={c.defId}
              onClick={() => confirmLongRestLoss(c.defId)}
              className="btn-secondary text-xs py-2"
            >
              {def?.name ?? c.defId} ({c.currentSide})
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EndOfRoundBar({ round, character, shortRestLostCardId, shortRestRerolled, performShortRestAction, shortRestRerollAction, endRound }: {
  round: number;
  character: ReturnType<typeof useGameStore.getState>['character'];
  shortRestLostCardId: string | null;
  shortRestRerolled: boolean;
  performShortRestAction: () => void;
  shortRestRerollAction: () => void;
  endRound: () => void;
}) {
  const canDoRest = canRest(character.cards);

  return (
    <div className="flex items-center justify-center gap-4 py-3 px-4">
      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
        {t('end_of_round')} {round}
      </span>
      {canDoRest && !shortRestLostCardId && (
        <button onClick={performShortRestAction} className="btn-secondary text-xs px-4 py-1.5">
          {t('short_rest')}
        </button>
      )}
      {shortRestLostCardId && !shortRestRerolled && (
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
          {t('lost')}: {character.cardDefs.find(d => d.id === shortRestLostCardId)?.name ?? shortRestLostCardId}
          <button onClick={shortRestRerollAction} className="btn-secondary text-xs px-2 py-0.5">
            {t('reroll')}
          </button>
        </div>
      )}
      {shortRestLostCardId && shortRestRerolled && (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {t('rerolled')} {character.cardDefs.find(d => d.id === shortRestLostCardId)?.name ?? shortRestLostCardId}
        </span>
      )}
      <button onClick={endRound} className="btn-primary px-6 py-1.5 text-sm">
        {t('next_round')}
      </button>
    </div>
  );
}

function MonsterStepBar({ monsters, monsterDefs, turnOrder, currentTurnIndex, monsterStepQueue, monsterStepIndex, monsterStepPhase, monsterStepLogs, onAdvance }: {
  monsters: Map<string, import('@/types/monsters').MonsterInstance>;
  monsterDefs: Record<string, import('@/types/monsters').MonsterDef>;
  turnOrder: import('@/types/game').InitiativeEntry[];
  currentTurnIndex: number;
  monsterStepQueue: string[];
  monsterStepIndex: number;
  monsterStepPhase: 'preview' | 'resolved';
  monsterStepLogs: string[];
  onAdvance: () => void;
}) {
  const currentEntry = turnOrder[currentTurnIndex];
  if (!currentEntry) return null;

  const defId = currentEntry.entityId;
  const monsterDef = monsterDefs[defId];
  if (!monsterDef) return null;

  const actionIndex = currentEntry.actionIndex ?? 0;
  const action = monsterDef.actions[actionIndex];
  const instanceId = monsterStepQueue[monsterStepIndex];
  const monster = monsters.get(instanceId);
  const isLast = monsterStepIndex >= monsterStepQueue.length - 1;

  return (
    <div className="flex items-center gap-4 py-3 px-4">
      {/* Monster info */}
      <div className="flex items-center gap-2">
        <ActionIcon icon="attack" size={14} color="var(--color-blood-red-bright)" />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-blood-red-bright)', fontFamily: 'var(--font-display)' }}>
          {monsterDef.name} #{monsterStepIndex + 1}/{monsterStepQueue.length}
          {monster?.isElite ? ` (${t('elite')})` : ''}
        </span>
      </div>

      {/* Action preview */}
      {monsterStepPhase === 'preview' && (
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
            {action.abilities.map((a, i) => (
              <span key={i} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded" style={{ background: 'var(--color-bg-primary)' }}>
                <ActionIcon icon={a.type as any} size={10} />
                {a.value ?? ''}
              </span>
            ))}
          </div>
          <button onClick={onAdvance} className="btn-secondary text-xs px-4 py-1.5 ml-auto">
            {t('monster_step_execute')}
          </button>
        </div>
      )}

      {/* Result */}
      {monsterStepPhase === 'resolved' && (
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 text-[10px] max-w-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {monsterStepLogs.length > 0 ? monsterStepLogs[monsterStepLogs.length - 1] : t('monster_step_result')}
          </div>
          <button onClick={onAdvance} className="btn-secondary text-xs px-4 py-1.5 ml-auto">
            {isLast ? t('monster_step_finish') : t('monster_step_next')}
          </button>
        </div>
      )}
    </div>
  );
}
