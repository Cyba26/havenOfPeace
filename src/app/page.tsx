'use client';
import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { HexGrid } from '@/components/board/HexGrid';
import { CardHand } from '@/components/cards/CardHand';
import { CardSelector } from '@/components/cards/CardSelector';
import { GameLog } from '@/components/ui/GameLog';
import { StatusBar } from '@/components/ui/StatusBar';
import { ElementTracker } from '@/components/ui/ElementTracker';
import { DamageNegation } from '@/components/ui/DamageNegation';
import { ItemBar } from '@/components/ui/ItemBar';
import { canRest, getDiscardedCards } from '@/engine/cards';

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-gold)' }}>
          Haven of Peace
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm max-w-md text-center">
          A solo dungeon-crawling card game inspired by Gloomhaven: Buttons & Bugs
        </p>
        <div className="flex gap-4">
          <div className="rounded-lg p-6 text-center" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-gold-dim)' }}>
            <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-gold)' }}>
              1. The Gatehouse
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Clear the guards blocking the old gatehouse passage.
            </p>
            <div className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Bruiser (10 HP) &mdash; 3 enemies
            </div>
            <button onClick={() => initScenario('scenario-01')} className="btn-primary text-sm px-6 py-2">
              Begin
            </button>
          </div>
          <div className="rounded-lg p-6 text-center" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-gold-dim)' }}>
            <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-gold)' }}>
              2. The Ambush
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Fight through an ambush with an elite guard.
            </p>
            <div className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Bruiser (10 HP) &mdash; 4 enemies (1 elite)
            </div>
            <button onClick={() => initScenario('scenario-02')} className="btn-primary text-sm px-6 py-2">
              Begin
            </button>
          </div>
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
          className="text-3xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: isVictory ? 'var(--color-health-green-bright)' : 'var(--color-blood-red-bright)' }}
        >
          {isVictory ? 'Victory!' : 'Defeated...'}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
          {isVictory ? 'All enemies have been vanquished.' : 'Your quest has ended in failure.'}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Round {round} &mdash; {character.currentHP}/{character.maxHP} HP remaining
        </p>
        <div className="rounded-lg p-4 w-full max-w-md" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-gold-dim)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-gold)' }}>Battle Log</h3>
          <GameLog entries={log} />
        </div>
        <button onClick={resetGame} className="btn-primary px-6 py-2">
          Play Again
        </button>
      </div>
    );
  }

  // ─── Main Game Layout ─────────────────────────────────────────
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

      <div className="flex-1 flex min-h-0">
        {/* Left: Game Board */}
        <div className="flex-1 flex items-center justify-center p-4 min-w-0">
          <HexGrid
            hexMap={hexMap}
            hexSize={50}
            characterPosition={character.position}
            characterHP={character.currentHP}
            characterMaxHP={character.maxHP}
            characterConditions={character.conditions}
            monsters={monsters}
            reachableHexes={reachableHexes}
            validAttackTargets={validAttackTargets}
            onHexClick={playerTurnSubPhase === 'SELECTING_MOVE_HEX' ? selectMoveHex : undefined}
            onMonsterClick={playerTurnSubPhase === 'SELECTING_ATTACK_TARGET' ? selectAttackTarget : undefined}
          />
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
                selectCard={selectCard}
                deselectCard={deselectCard}
                setInitiativeCard={setInitiativeCard}
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

            {/* Items */}
            {pendingDamage === null && character.items.length > 0 && (
              <ItemBar
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
              Battle Log
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
  selectCard: (defId: string) => void;
  deselectCard: (defId: string) => void;
  setInitiativeCard: (defId: string) => void;
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
  confirmCardSelection, selectCard, deselectCard, setInitiativeCard,
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
          Select 2 Cards
        </div>
        <CardHand
          cardDefs={character.cardDefs}
          cardStates={character.cards}
          selectedCards={character.selectedCards}
          initiativeCard={character.initiativeCard}
          phase="selection"
          onSelectCard={selectCard}
          onDeselectCard={deselectCard}
          onSetInitiative={setInitiativeCard}
        />
        <div className="flex gap-2">
          <button
            onClick={confirmCardSelection}
            disabled={!canConfirm}
            className="btn-primary flex-1"
          >
            Confirm Selection
          </button>
        </div>
        {canDoRest && (
          <div className="flex gap-2">
            <button onClick={declareLongRest} className="btn-secondary text-xs flex-1">
              Long Rest
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
            Assign Actions
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
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
            Select Destination
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Click a highlighted hex to move there.
          </p>
        </div>
      );
    }

    if (playerTurnSubPhase === 'SELECTING_ATTACK_TARGET') {
      return (
        <div className="text-center py-4">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
            Select Target
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Click a glowing enemy to attack.
          </p>
        </div>
      );
    }

    if (playerTurnSubPhase === 'TURN_COMPLETE') {
      return (
        <div className="text-center py-4">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
            Turn Complete
          </div>
          <button onClick={endPlayerTurn} className="btn-primary">
            End Turn
          </button>
        </div>
      );
    }

    return (
      <div className="text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
        <div className="text-xs">Executing actions...</div>
      </div>
    );
  }

  // ─── Monster Turn ────
  if (phase === 'MONSTER_TURN') {
    return (
      <div className="text-center py-4">
        <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-blood-red-bright)', fontFamily: 'var(--font-display)' }}>
          Monster Turn
        </div>
        <button onClick={executeMonsterPhase} className="btn-secondary">
          Execute Monster Actions
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
        <div className="text-xs font-semibold" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
          Long Rest — Choose Card to Lose
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Heal 2 HP. Choose a card to permanently lose:
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
                {def?.name ?? c.defId} ({c.location}, {c.currentSide})
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
          End of Round {round}
        </div>
        {canDoRest && (
          <button onClick={performShortRestAction} className="btn-secondary text-xs">
            Short Rest
          </button>
        )}
        {shortRestLostCardId && !shortRestRerolled && (
          <div className="text-xs p-2 rounded" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
            Lost: {character.cardDefs.find(d => d.id === shortRestLostCardId)?.name ?? shortRestLostCardId}
            <button onClick={shortRestRerollAction} className="btn-secondary text-xs ml-2">
              Reroll (−1 HP)
            </button>
          </div>
        )}
        {shortRestLostCardId && shortRestRerolled && (
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Rerolled — lost: {character.cardDefs.find(d => d.id === shortRestLostCardId)?.name ?? shortRestLostCardId}
          </div>
        )}
        <button onClick={endRound} className="btn-primary">
          Next Round
        </button>
      </div>
    );
  }

  return null;
}
