import { create } from 'zustand';
import type { GamePhase, PlayerTurnSubPhase, InitiativeEntry, CharacterState } from '@/types/game';
import type { AxialCoord, HexMap, HexCell } from '@/types/hex';
import type { AbilityCardDef, CardState, AbilityAction } from '@/types/cards';
import type { MonsterInstance, MonsterDef } from '@/types/monsters';
import { hexKey, hexDistance, getReachableHexes } from '@/engine/hex';
import { initCardStates, playCard, getCardInitiative, getHandCards, getDiscardedCards, performShortRest, shortRestReroll, performLongRestRecovery, negateByDiscardA, negateByDiscard2B, negateByLoseCard } from '@/engine/cards';
import { checkKillAllObjective } from '@/engine/gameState';
import { getCharacterBlockedHexes } from '@/engine/movement';
import { resolveAttack, getValidAttackTargets, applyDamageToMonster, applyDamageToCharacter, determineAdvantage, resolveRetaliate } from '@/engine/combat';
import { calculatePushDestination, calculatePullDestination } from '@/engine/pushPull';
import { resolveMonsterTurn, rollMonsterAction } from '@/engine/monsterAI';
import { buildTurnOrder, getNextTurnIndex, resolveTurn, isRoundComplete } from '@/engine/turnManager';
import { applyCondition, hasCondition, processStartOfTurnConditions, processEndOfTurnConditions, processHealWithConditions } from '@/engine/conditions';
import { infuseElement, consumeElement } from '@/engine/elements';
import type { ElementType } from '@/types/cards';
import { CHARACTERS, MONSTER_DEFS, SCENARIOS, ITEMS } from '@/data';
import type { ItemDef, ItemState } from '@/types/items';

interface GameStore {
  // ─── State ───────────────────────────────────────────
  phase: GamePhase;
  playerTurnSubPhase: PlayerTurnSubPhase | null;
  round: number;
  hexMap: HexMap;
  character: CharacterState;
  monsterDefs: Map<string, MonsterDef>;
  monsters: Map<string, MonsterInstance>;
  turnOrder: InitiativeEntry[];
  currentTurnIndex: number;
  reachableHexes: Set<string> | null;
  validAttackTargets: string[] | null;
  currentAction: AbilityAction | null;
  log: string[];
  objectiveType: 'kill_all';
  // Track which action we're executing
  pendingActions: AbilityAction[];
  pendingActionIndex: number;
  /** Last monster attacked (for push/pull targeting) */
  lastAttackTargetId: string | null;
  /** Monster round bonuses from rolled actions */
  monsterRoundBonuses: Map<string, { shield: number }>;
  /** Currently infused elements */
  infusedElements: Set<ElementType>;
  /** Pending damage to character (waiting for negation decision) */
  pendingDamage: number | null;
  pendingDamageSource: string;
  /** Saved state to resume after damage resolution */
  afterDamageState: Partial<GameStore> | null;
  /** Short rest reroll tracking */
  shortRestLostCardId: string | null;
  shortRestRerolled: boolean;
  /** Whether the character declared a long rest this round */
  isLongResting: boolean;
  /** Multi-target attack: remaining targets to select */
  remainingTargets: number;
  /** Multi-target attack: already-targeted monster IDs */
  selectedTargetIds: string[];
  /** Action execution order */
  actionOrder: 'top_first' | 'bottom_first';
  /** Modifier popup (transient) */
  modifierPopup: { value: number; isMiss: boolean; isDouble: boolean } | null;
  /** Attack animation */
  attackAnimation: { from: AxialCoord; to: AxialCoord } | null;
  /** Step-by-step monster phase */
  monsterStepQueue: string[];
  monsterStepIndex: number;
  monsterStepPhase: 'preview' | 'resolved' | null;
  monsterStepLogs: string[];
  monsterAccumulatedDamage: number;

  // ─── Actions ─────────────────────────────────────────
  initScenario: (scenarioId: string) => void;
  selectCard: (defId: string) => void;
  deselectCard: (defId: string) => void;
  setInitiativeCard: (defId: string) => void;
  confirmCardSelection: () => void;
  goBackToCardSelection: () => void;
  chooseTopCard: (defId: string) => void;
  chooseBottomCard: (defId: string) => void;
  useDefaultAction: (half: 'top' | 'bottom') => void;
  setActionOrder: (order: 'top_first' | 'bottom_first') => void;
  confirmActionChoice: () => void;
  selectMoveHex: (coord: AxialCoord) => void;
  selectAttackTarget: (instanceId: string) => void;
  endPlayerTurn: () => void;
  executeMonsterPhase: () => void;
  advanceMonsterStep: () => void;
  endRound: () => void;
  performShortRestAction: () => void;
  shortRestRerollAction: () => void;
  acceptDamage: () => void;
  negateDamageDiscardA: (cardDefId: string) => void;
  negateDamageDiscard2B: (cardDefId1: string, cardDefId2: string) => void;
  negateDamageLoseCard: (cardDefId: string) => void;
  declareLongRest: () => void;
  confirmLongRestLoss: (cardDefId: string) => void;
  useItem: (itemDefId: string) => void;
  resetGame: () => void;
  addLog: (message: string) => void;
}

function createEmptyCharacter(): CharacterState {
  return {
    name: '',
    position: { q: 0, r: 0 },
    currentHP: 0,
    maxHP: 0,
    level: 1,
    conditions: [],
    cardDefs: [],
    cards: [],
    selectedCards: null,
    initiativeCard: null,
    topCardId: null,
    bottomCardId: null,
    executedTop: false,
    executedBottom: false,
    modifierTable: [],
    modifierRow: 0,
    activeShield: 0,
    activeRetaliate: 0,
    activeRetaliateRange: 1,
    itemDefs: [],
    items: [],
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'SCENARIO_SETUP',
  playerTurnSubPhase: null,
  round: 0,
  hexMap: { cells: new Map() },
  character: createEmptyCharacter(),
  monsterDefs: new Map(),
  monsters: new Map(),
  turnOrder: [],
  currentTurnIndex: 0,
  reachableHexes: null,
  validAttackTargets: null,
  currentAction: null,
  log: [],
  objectiveType: 'kill_all',
  pendingActions: [],
  pendingActionIndex: 0,
  lastAttackTargetId: null,
  monsterRoundBonuses: new Map(),
  infusedElements: new Set<ElementType>(),
  pendingDamage: null,
  pendingDamageSource: '',
  afterDamageState: null,
  shortRestLostCardId: null,
  shortRestRerolled: false,
  isLongResting: false,
  remainingTargets: 0,
  selectedTargetIds: [],
  actionOrder: 'top_first' as const,
  modifierPopup: null,
  attackAnimation: null,
  monsterStepQueue: [],
  monsterStepIndex: 0,
  monsterStepPhase: null,
  monsterStepLogs: [],
  monsterAccumulatedDamage: 0,

  addLog: (message: string) => {
    set(state => ({ log: [...state.log, message] }));
  },

  // ─── Scenario Init ──────────────────────────────────────────

  initScenario: (scenarioId: string) => {
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) return;

    // Build hex map
    const cells = new Map<string, HexCell>();
    for (const h of scenario.hexes) {
      const coord: AxialCoord = { q: h.q, r: h.r };
      cells.set(hexKey(coord), {
        coord,
        terrain: h.terrain,
        hazardDamage: h.hazardDamage,
        isStartingHex: h.isStartingHex,
      });
    }

    // Load monster defs
    const monsterDefs = new Map<string, MonsterDef>();
    for (const defId of scenario.requiredMonsters) {
      const def = MONSTER_DEFS[defId];
      if (def) monsterDefs.set(defId, def);
    }

    // Create monster instances
    const monsters = new Map<string, MonsterInstance>();
    const counters: Record<string, number> = {};
    for (const placement of scenario.monsters) {
      const def = monsterDefs.get(placement.defId);
      if (!def) continue;
      counters[placement.defId] = (counters[placement.defId] ?? 0) + 1;
      const instanceId = `${placement.defId}-${counters[placement.defId]}`;
      monsters.set(instanceId, {
        instanceId,
        defId: placement.defId,
        isElite: placement.isElite,
        currentHP: placement.isElite ? def.eliteHP : def.baseHP,
        maxHP: placement.isElite ? def.eliteHP : def.baseHP,
        position: placement.position,
        conditions: [],
        modifierRow: 0,
      });
    }

    // Load character
    const charData = CHARACTERS.bruiser;
    const cardDefs = charData.cards;
    const cards = initCardStates(cardDefs);

    // Equip starter items
    const starterItemIds = ['health-potion', 'leather-armor'];
    const itemDefs = starterItemIds.map(id => ITEMS[id]).filter(Boolean) as ItemDef[];
    const itemStates: ItemState[] = itemDefs.map(d => ({ defId: d.id, isSpent: false, isLost: false }));

    set({
      phase: 'CARD_SELECTION',
      playerTurnSubPhase: null,
      round: 1,
      hexMap: { cells },
      character: {
        name: charData.name,
        position: scenario.characterStart,
        currentHP: charData.maxHP,
        maxHP: charData.maxHP,
        level: 1,
        conditions: [],
        cardDefs,
        cards,
        selectedCards: null,
        initiativeCard: null,
        topCardId: null,
        bottomCardId: null,
        executedTop: false,
        executedBottom: false,
        modifierTable: charData.modifierTable,
        modifierRow: 0,
        activeShield: 0,
        activeRetaliate: 0,
        activeRetaliateRange: 1,
        itemDefs,
        items: itemStates,
      },
      monsterDefs,
      monsters,
      turnOrder: [],
      currentTurnIndex: 0,
      reachableHexes: null,
      validAttackTargets: null,
      currentAction: null,
      log: [`Round 1 — ${scenario.name}: ${scenario.description}`],
      pendingActions: [],
      pendingActionIndex: 0,
      infusedElements: new Set<ElementType>(),
      pendingDamage: null,
      pendingDamageSource: '',
      afterDamageState: null,
      shortRestLostCardId: null,
      shortRestRerolled: false,
      isLongResting: false,
      remainingTargets: 0,
      selectedTargetIds: [],
    });
  },

  // ─── Card Selection ─────────────────────────────────────────

  selectCard: (defId: string) => {
    const { character } = get();
    if (!character.selectedCards) {
      set({ character: { ...character, selectedCards: [defId, ''] as [string, string], initiativeCard: defId } });
    } else if (!character.selectedCards[1]) {
      set({ character: { ...character, selectedCards: [character.selectedCards[0], defId] as [string, string] } });
    }
  },

  deselectCard: (defId: string) => {
    const { character } = get();
    if (!character.selectedCards) return;
    if (character.selectedCards[0] === defId) {
      const remaining = character.selectedCards[1];
      set({
        character: {
          ...character,
          selectedCards: remaining ? [remaining, ''] as [string, string] : null,
          initiativeCard: remaining || null,
        },
      });
    } else if (character.selectedCards[1] === defId) {
      set({
        character: {
          ...character,
          selectedCards: [character.selectedCards[0], ''] as [string, string],
          initiativeCard: character.initiativeCard === defId ? character.selectedCards[0] : character.initiativeCard,
        },
      });
    }
  },

  setInitiativeCard: (defId: string) => {
    set(state => ({ character: { ...state.character, initiativeCard: defId } }));
  },

  confirmCardSelection: () => {
    const { character, monsterDefs, monsters } = get();
    if (!character.selectedCards?.[0] || !character.selectedCards?.[1] || !character.initiativeCard) return;

    // Get character initiative
    const initCardDef = character.cardDefs.find(d => d.id === character.initiativeCard);
    const initCardState = character.cards.find(c => c.defId === character.initiativeCard);
    if (!initCardDef || !initCardState) return;
    const charInitiative = getCardInitiative(initCardDef, initCardState);

    // Build turn order
    const turnOrder = buildTurnOrder(charInitiative, monsterDefs, monsters);
    const nextIdx = getNextTurnIndex(turnOrder);
    const nextEntry = turnOrder[nextIdx];

    // Process start-of-turn conditions for character (wound) if going first
    let updatedCharacter = {
      ...character,
      topCardId: null as string | null,
      bottomCardId: null as string | null,
      executedTop: false,
      executedBottom: false,
    };

    if (nextEntry?.entityType === 'character') {
      const startOfTurn = processStartOfTurnConditions(updatedCharacter.conditions, updatedCharacter.currentHP);
      updatedCharacter = { ...updatedCharacter, currentHP: startOfTurn.newHP };
      for (const l of startOfTurn.logs) {
        get().addLog(`${character.name}: ${l}`);
      }
      if (updatedCharacter.currentHP <= 0) {
        set({ character: updatedCharacter, phase: 'SCENARIO_FAILED', playerTurnSubPhase: null });
        get().addLog('You have been defeated by your wounds...');
        return;
      }
    }

    set({
      turnOrder,
      currentTurnIndex: nextIdx,
      phase: nextEntry?.entityType === 'character' ? 'PLAYER_TURN' : 'MONSTER_TURN',
      playerTurnSubPhase: nextEntry?.entityType === 'character' ? 'CHOOSING_ACTION' : null,
      character: updatedCharacter,
    });

    get().addLog(`Initiative: ${turnOrder.map(e => `${e.entityId}(${e.initiative})`).join(', ')}`);
  },

  goBackToCardSelection: () => {
    const { character } = get();
    set({
      phase: 'CARD_SELECTION',
      playerTurnSubPhase: null,
      turnOrder: [],
      currentTurnIndex: 0,
      character: {
        ...character,
        topCardId: null,
        bottomCardId: null,
        executedTop: false,
        executedBottom: false,
      },
    });
  },

  // ─── Action Choice ──────────────────────────────────────────

  chooseTopCard: (defId: string) => {
    const { character } = get();
    set({
      character: {
        ...character,
        topCardId: defId,
        bottomCardId: character.bottomCardId === defId ? null : character.bottomCardId,
      },
    });
  },

  chooseBottomCard: (defId: string) => {
    const { character } = get();
    if (character.topCardId === defId) return;
    set({ character: { ...character, bottomCardId: defId } });
  },

  useDefaultAction: (half: 'top' | 'bottom') => {
    const { character } = get();
    if (half === 'top') {
      set({ character: { ...character, topCardId: '__default_top__' } });
    } else {
      set({ character: { ...character, bottomCardId: '__default_bottom__' } });
    }
  },

  setActionOrder: (order) => set({ actionOrder: order }),

  confirmActionChoice: () => {
    const { character, hexMap, monsters } = get();
    const { topCardId, bottomCardId, selectedCards } = character;
    if (!topCardId || !bottomCardId || !selectedCards) return;

    // Resolve top actions (may be multiple abilities in one card half)
    let topActions: AbilityAction[];
    if (topCardId === '__default_top__') {
      topActions = [{ type: 'attack', value: 2 }];
    } else {
      const def = character.cardDefs.find(d => d.id === topCardId);
      const state = character.cards.find(c => c.defId === topCardId);
      if (!def || !state) return;
      const side = state.currentSide === 'A' ? def.sideA : def.sideB;
      topActions = side.top.actions.length > 0 ? side.top.actions : [{ type: 'attack', value: 2 }];
    }

    // Resolve bottom actions
    let bottomActions: AbilityAction[];
    if (bottomCardId === '__default_bottom__') {
      bottomActions = [{ type: 'move', value: 2 }];
    } else {
      const def = character.cardDefs.find(d => d.id === bottomCardId);
      const state = character.cards.find(c => c.defId === bottomCardId);
      if (!def || !state) return;
      const side = state.currentSide === 'A' ? def.sideA : def.sideB;
      bottomActions = side.bottom.actions.length > 0 ? side.bottom.actions : [{ type: 'move', value: 2 }];
    }

    // Queue actions in chosen order
    const { actionOrder } = get();
    const allActions = actionOrder === 'top_first'
      ? [...topActions, ...bottomActions]
      : [...bottomActions, ...topActions];
    set({
      pendingActions: allActions,
      pendingActionIndex: 0,
    });

    // Start executing first action
    executeNextAction(get, set, allActions[0]);
  },

  // ─── Movement ───────────────────────────────────────────────

  selectMoveHex: (coord: AxialCoord) => {
    const state = get();
    const key = hexKey(coord);
    if (!state.reachableHexes?.has(key)) return;

    const newCharacter = { ...state.character, position: coord };

    state.addLog(`${state.character.name} moves to (${coord.q}, ${coord.r})`);

    set({
      character: newCharacter,
      reachableHexes: null,
    });

    // Advance to next action
    advanceAction(get, set);
  },

  // ─── Attack ─────────────────────────────────────────────────

  selectAttackTarget: (instanceId: string) => {
    const state = get();
    const monster = state.monsters.get(instanceId);
    if (!monster) return;

    const action = state.currentAction;
    const baseAttack = action?.value ?? 2;
    const piercing = action?.piercing ?? 0;
    const range = action?.range ?? 1;
    const isRanged = range > 1;
    const dist = hexDistance(state.character.position, monster.position);
    const isAdjacent = dist <= 1;

    // Determine advantage/disadvantage
    const advantage = determineAdvantage(state.character.conditions, isRanged, isAdjacent);

    // Check if target has poison (+1 attack bonus)
    const targetPoisoned = hasCondition(monster.conditions, 'poison');

    // Get monster shield from def + round bonuses
    const monsterDef = state.monsterDefs.get(monster.defId);
    const defShield = monsterDef?.shield ?? 0;
    const roundBonus = state.monsterRoundBonuses.get(monster.instanceId);
    const monsterShield = defShield + (roundBonus?.shield ?? 0);

    // Set attack animation
    set({ attackAnimation: { from: state.character.position, to: monster.position } });

    // Resolve attack with modifier
    const result = resolveAttack(
      baseAttack,
      state.character.modifierTable,
      state.character.modifierRow,
      monsterShield,
      piercing,
      advantage,
      targetPoisoned,
    );

    // Show modifier popup
    set({ modifierPopup: { value: result.modifier.rawModifier, isMiss: result.modifier.isMiss, isDouble: result.modifier.isDouble } });
    setTimeout(() => set({ modifierPopup: null }), 1500);

    const updatedMonster = applyDamageToMonster(monster, result.damage);
    const newMonsters = new Map(state.monsters);

    // Apply condition from action (if target survives)
    let finalMonster = updatedMonster;
    if (action?.condition && updatedMonster.currentHP > 0) {
      finalMonster = { ...finalMonster, conditions: applyCondition(finalMonster.conditions, action.condition) };
      state.addLog(`${monster.defId} is now ${action.condition}!`);
    }

    newMonsters.set(instanceId, finalMonster);

    if (result.modifier.isMiss) {
      state.addLog(`${state.character.name} attacks ${monster.defId} — MISS!`);
    } else if (result.modifier.isDouble) {
      state.addLog(`${state.character.name} attacks ${monster.defId} — x2! ${result.damage} damage`);
    } else {
      state.addLog(`${state.character.name} attacks ${monster.defId} for ${result.damage} damage${advantage !== 'normal' ? ` (${advantage})` : ''}`);
    }

    // Retaliate: if monster survived, check for retaliate
    let newCharacterHP = state.character.currentHP;
    if (finalMonster.currentHP > 0 && monsterDef) {
      const retaliateValue = monsterDef.retaliate ?? 0;
      const retaliateRange = monsterDef.retaliateRange ?? 1;
      if (retaliateValue > 0) {
        const retResult = resolveRetaliate(retaliateValue, retaliateRange, finalMonster.position, state.character.position);
        if (retResult.inRange) {
          newCharacterHP = applyDamageToCharacter(newCharacterHP, retResult.damage);
          state.addLog(`${monster.defId} retaliates for ${retResult.damage} damage!`);
        }
      }
    }

    if (finalMonster.currentHP <= 0) {
      state.addLog(`${monster.defId} ${monster.instanceId} is defeated!`);
    }

    const newSelectedTargets = [...state.selectedTargetIds, instanceId];
    const newRemainingTargets = state.remainingTargets - 1;

    set({
      monsters: newMonsters,
      character: { ...state.character, modifierRow: result.modifier.newRow, currentHP: newCharacterHP },
      lastAttackTargetId: instanceId,
      selectedTargetIds: newSelectedTargets,
      remainingTargets: newRemainingTargets,
    });

    // Check character death from retaliate
    if (newCharacterHP <= 0) {
      set({ phase: 'SCENARIO_FAILED', playerTurnSubPhase: null, validAttackTargets: null, currentAction: null });
      get().addLog('You have been defeated...');
      return;
    }

    // Check win condition
    if (checkKillAllObjective(newMonsters)) {
      set({ phase: 'SCENARIO_COMPLETE', playerTurnSubPhase: null, validAttackTargets: null, currentAction: null });
      get().addLog('All enemies defeated! Victory!');
      return;
    }

    // Multi-target: if more targets remaining, re-enter selection
    if (newRemainingTargets > 0) {
      const range = action?.range ?? 1;
      const remainingValidTargets = getValidAttackTargets(
        state.character.position, range, state.hexMap, newMonsters,
      ).filter(id => !newSelectedTargets.includes(id));

      if (remainingValidTargets.length > 0) {
        set({
          validAttackTargets: remainingValidTargets,
          playerTurnSubPhase: 'SELECTING_ATTACK_TARGET',
        });
        return;
      }
    }

    // Done with this attack action
    set({ validAttackTargets: null, currentAction: null });
    advanceAction(get, set);
  },

  // ─── End Player Turn ────────────────────────────────────────

  endPlayerTurn: () => {
    const state = get();
    const { character } = state;

    // Play both selected cards (handle A/B transitions)
    // Determine which half was used from each card based on topCardId/bottomCardId
    let updatedCards = [...character.cards];
    if (character.selectedCards) {
      for (const defId of character.selectedCards) {
        if (!defId || defId.startsWith('__default')) continue;
        const cardDef = character.cardDefs.find(d => d.id === defId);
        const cardIdx = updatedCards.findIndex(c => c.defId === defId);
        if (cardIdx === -1 || !cardDef) continue;
        const cardState = updatedCards[cardIdx];
        const side = cardState.currentSide === 'A' ? cardDef.sideA : cardDef.sideB;
        // Check the half that was actually used from this card
        let isLost = false;
        if (character.topCardId === defId) {
          isLost = side.top.isLost;
        } else if (character.bottomCardId === defId) {
          isLost = side.bottom.isLost;
        }
        updatedCards[cardIdx] = playCard(cardState, isLost);
      }
    }

    // Process end-of-turn conditions for character
    const endOfTurn = processEndOfTurnConditions(character.conditions);
    if (endOfTurn.removed.length > 0) {
      state.addLog(`${character.name}: ${endOfTurn.removed.join(', ')} expired`);
    }

    const newCharacter: CharacterState = {
      ...character,
      cards: updatedCards,
      conditions: endOfTurn.newConditions,
      selectedCards: null,
      initiativeCard: null,
      topCardId: null,
      bottomCardId: null,
      executedTop: false,
      executedBottom: false,
    };

    // Advance turn
    let turnOrder = resolveTurn(state.turnOrder, state.currentTurnIndex);
    const nextIdx = getNextTurnIndex(turnOrder);

    if (nextIdx === -1) {
      set({
        character: newCharacter,
        turnOrder,
        phase: 'END_OF_ROUND',
        playerTurnSubPhase: null,
      });
    } else {
      const nextEntry = turnOrder[nextIdx];
      set({
        character: newCharacter,
        turnOrder,
        currentTurnIndex: nextIdx,
        phase: nextEntry.entityType === 'character' ? 'PLAYER_TURN' : 'MONSTER_TURN',
        playerTurnSubPhase: nextEntry.entityType === 'character' ? 'CHOOSING_ACTION' : null,
      });
    }
  },

  // ─── Monster Phase (step-by-step) ───────────────────────────

  executeMonsterPhase: () => {
    const state = get();
    const currentEntry = state.turnOrder[state.currentTurnIndex];
    if (!currentEntry || currentEntry.entityType !== 'monster_group') return;

    const defId = currentEntry.entityId;
    const monsterDef = state.monsterDefs.get(defId);
    if (!monsterDef) return;

    // Build sorted queue of alive monsters of this type
    const sortedMonsters = Array.from(state.monsters.values())
      .filter(m => m.defId === defId && m.currentHP > 0)
      .sort((a, b) => {
        const numA = parseInt(a.instanceId.split('-').pop() ?? '0');
        const numB = parseInt(b.instanceId.split('-').pop() ?? '0');
        return numA - numB;
      });

    if (sortedMonsters.length === 0) {
      // No alive monsters — skip this turn
      const turnOrder = resolveTurn(state.turnOrder, state.currentTurnIndex);
      const nextIdx = getNextTurnIndex(turnOrder);
      if (nextIdx === -1) {
        set({ turnOrder, phase: 'END_OF_ROUND' as GamePhase, playerTurnSubPhase: null });
      } else {
        const isCharNext = turnOrder[nextIdx].entityType === 'character';
        set({
          turnOrder,
          currentTurnIndex: nextIdx,
          phase: (isCharNext ? (state.isLongResting ? 'RESTING' : 'PLAYER_TURN') : 'MONSTER_TURN') as GamePhase,
          playerTurnSubPhase: isCharNext && !state.isLongResting ? 'CHOOSING_ACTION' : null,
        });
      }
      return;
    }

    // Initialize step-by-step mode
    set({
      monsterStepQueue: sortedMonsters.map(m => m.instanceId),
      monsterStepIndex: 0,
      monsterStepPhase: 'preview',
      monsterStepLogs: [],
      monsterAccumulatedDamage: 0,
    });
  },

  advanceMonsterStep: () => {
    const state = get();
    const { monsterStepQueue, monsterStepIndex, monsterStepPhase, monsterAccumulatedDamage } = state;
    if (monsterStepPhase === null) return;

    const currentEntry = state.turnOrder[state.currentTurnIndex];
    if (!currentEntry || currentEntry.entityType !== 'monster_group') return;

    const defId = currentEntry.entityId;
    const monsterDef = state.monsterDefs.get(defId);
    if (!monsterDef) return;

    const actionIndex = currentEntry.actionIndex ?? 0;
    const action = monsterDef.actions[actionIndex];
    const shieldAbility = action.abilities.find(a => a.type === 'shield');
    const actionShield = shieldAbility?.value ?? 0;

    if (monsterStepPhase === 'preview') {
      // Execute the current monster's turn
      const instanceId = monsterStepQueue[monsterStepIndex];
      const monster = state.monsters.get(instanceId);
      if (!monster) { set({ monsterStepPhase: 'resolved', monsterStepLogs: ['Monstre introuvable'] }); return; }

      let currentMonster = { ...monster };
      const logs: string[] = [];
      let dmgToChar = 0;
      const newMonsters = new Map(state.monsters);
      const newRoundBonuses = new Map(state.monsterRoundBonuses);

      // Start-of-turn conditions
      const startOfTurn = processStartOfTurnConditions(currentMonster.conditions, currentMonster.currentHP);
      if (startOfTurn.logs.length > 0) {
        for (const l of startOfTurn.logs) logs.push(`${monsterDef.name}: ${l}`);
      }
      currentMonster = { ...currentMonster, currentHP: startOfTurn.newHP };

      if (currentMonster.currentHP <= 0) {
        newMonsters.set(instanceId, currentMonster);
        logs.push(`${monsterDef.name} meurt de ses blessures !`);
        for (const l of logs) state.addLog(l);
        set({ monsters: newMonsters, monsterStepPhase: 'resolved', monsterStepLogs: logs });
        return;
      }

      // Resolve turn
      const result = resolveMonsterTurn(
        currentMonster, monsterDef, action,
        state.character.position, state.character.activeShield,
        state.hexMap, newMonsters,
      );

      // End-of-turn conditions
      const endOfTurn = processEndOfTurnConditions(result.monster.conditions);
      const finalMonster = { ...result.monster, conditions: endOfTurn.newConditions };
      if (endOfTurn.removed.length > 0) {
        logs.push(`${monsterDef.name}: ${endOfTurn.removed.join(', ')} expiré`);
      }

      newMonsters.set(instanceId, finalMonster);
      if (actionShield > 0) {
        newRoundBonuses.set(instanceId, { shield: actionShield });
      }
      logs.push(...result.logEntries);

      // Ally heal
      if (result.healTarget) {
        const healTarget = newMonsters.get(result.healTarget.instanceId);
        if (healTarget && healTarget.currentHP > 0) {
          const newHP = Math.min(healTarget.maxHP, healTarget.currentHP + result.healTarget.amount);
          newMonsters.set(result.healTarget.instanceId, { ...healTarget, currentHP: newHP });
        }
      }

      // Attack damage to character
      if (result.attacked) {
        dmgToChar = result.attackDamage;
        // Set attack animation
        set({ attackAnimation: { from: result.newPosition, to: state.character.position } });

        // Character retaliate
        if (state.character.activeRetaliate > 0) {
          const retResult = resolveRetaliate(
            state.character.activeRetaliate, state.character.activeRetaliateRange,
            state.character.position, result.newPosition,
          );
          if (retResult.inRange && retResult.damage > 0) {
            const retaliatedMonster = applyDamageToMonster(finalMonster, retResult.damage);
            newMonsters.set(instanceId, retaliatedMonster);
            logs.push(`Joueur riposte pour ${retResult.damage} contre ${monsterDef.name} !`);
            if (retaliatedMonster.currentHP <= 0) {
              logs.push(`${monsterDef.name} est vaincu par la riposte !`);
            }
          }
        }
      }

      for (const l of logs) state.addLog(l);

      set({
        monsters: newMonsters,
        monsterRoundBonuses: newRoundBonuses,
        monsterStepPhase: 'resolved',
        monsterStepLogs: logs,
        monsterAccumulatedDamage: monsterAccumulatedDamage + dmgToChar,
      });
    } else if (monsterStepPhase === 'resolved') {
      // Move to next monster or finalize
      const nextIndex = monsterStepIndex + 1;
      if (nextIndex < monsterStepQueue.length) {
        set({ monsterStepIndex: nextIndex, monsterStepPhase: 'preview', monsterStepLogs: [] });
      } else {
        // All monsters processed — finalize
        const totalDamage = get().monsterAccumulatedDamage;
        const turnOrder = resolveTurn(state.turnOrder, state.currentTurnIndex);
        const nextIdx = getNextTurnIndex(turnOrder);
        const isCharNext = nextIdx !== -1 && turnOrder[nextIdx].entityType === 'character';
        const charPhase = state.isLongResting ? 'RESTING' : 'PLAYER_TURN';
        const charSubPhase = state.isLongResting ? null : 'CHOOSING_ACTION';

        const resetStep = { monsterStepQueue: [] as string[], monsterStepIndex: 0, monsterStepPhase: null as 'preview' | 'resolved' | null, monsterStepLogs: [] as string[], monsterAccumulatedDamage: 0 };

        const afterDamageState: Partial<GameStore> = nextIdx === -1
          ? { ...resetStep, turnOrder, phase: 'END_OF_ROUND' as GamePhase, playerTurnSubPhase: null }
          : { ...resetStep, turnOrder, currentTurnIndex: nextIdx, phase: (isCharNext ? charPhase : 'MONSTER_TURN') as GamePhase, playerTurnSubPhase: isCharNext ? charSubPhase : null };

        if (totalDamage > 0) {
          const characterHP = applyDamageToCharacter(state.character.currentHP, totalDamage);
          set({
            ...resetStep,
            pendingDamage: totalDamage,
            pendingDamageSource: `Attaques des monstres`,
            afterDamageState,
          });
        } else {
          set({ ...afterDamageState });
        }
      }
    }
  },

  // ─── End of Round ───────────────────────────────────────────

  endRound: () => {
    const state = get();
    const newRound = state.round + 1;

    // Check if character can play (has at least 2 cards in hand)
    let cards = state.character.cards;
    const handCards = getHandCards(cards);
    if (handCards.length < 2) {
      const discarded = getDiscardedCards(cards);
      if (discarded.length > 0) {
        // Force short rest: recover discards, lose one randomly
        const restResult = performShortRest(cards);
        cards = restResult.cards;
        get().addLog('Pas assez de cartes — repos court automatique.');
        if (restResult.lostCardId) {
          const lostName = state.character.cardDefs.find(d => d.id === restResult.lostCardId)?.name ?? restResult.lostCardId;
          get().addLog(`Carte perdue : ${lostName}`);
        }
        const handAfterRest = getHandCards(cards);
        if (handAfterRest.length < 2) {
          set({ phase: 'SCENARIO_FAILED', playerTurnSubPhase: null, character: { ...state.character, cards } });
          get().addLog('Épuisé — pas assez de cartes pour continuer.');
          return;
        }
      } else {
        set({ phase: 'SCENARIO_FAILED', playerTurnSubPhase: null });
        get().addLog('Épuisé — pas assez de cartes pour continuer.');
        return;
      }
    }

    set({
      round: newRound,
      phase: 'CARD_SELECTION',
      playerTurnSubPhase: null,
      turnOrder: [],
      currentTurnIndex: 0,
      lastAttackTargetId: null,
      monsterRoundBonuses: new Map(),
      infusedElements: new Set<ElementType>(),
      isLongResting: false,
      shortRestLostCardId: null,
      shortRestRerolled: false,
      remainingTargets: 0,
      selectedTargetIds: [],
      attackAnimation: null,
      monsterStepQueue: [],
      monsterStepIndex: 0,
      monsterStepPhase: null,
      monsterStepLogs: [],
      monsterAccumulatedDamage: 0,
      character: {
        ...state.character,
        cards,
        selectedCards: null,
        initiativeCard: null,
        topCardId: null,
        bottomCardId: null,
        executedTop: false,
        executedBottom: false,
        activeShield: 0,
        activeRetaliate: 0,
        activeRetaliateRange: 1,
      },
    });
    get().addLog(`Manche ${newRound} commence.`);
  },

  // ─── Damage Negation ────────────────────────────────────────

  acceptDamage: () => {
    const state = get();
    if (state.pendingDamage === null) return;

    const newHP = applyDamageToCharacter(state.character.currentHP, state.pendingDamage);
    get().addLog(`${state.character.name} takes ${state.pendingDamage} damage (${state.pendingDamageSource})`);

    if (newHP <= 0) {
      set({
        character: { ...state.character, currentHP: 0 },
        phase: 'SCENARIO_FAILED',
        playerTurnSubPhase: null,
        pendingDamage: null,
        afterDamageState: null,
      });
      get().addLog('You have been defeated...');
      return;
    }

    const afterState = state.afterDamageState ?? {};
    set({
      ...afterState,
      character: { ...state.character, currentHP: newHP },
      pendingDamage: null,
      afterDamageState: null,
    });
  },

  negateDamageDiscardA: (cardDefId: string) => {
    const state = get();
    if (state.pendingDamage === null) return;
    const updatedCards = negateByDiscardA(state.character.cards, cardDefId);
    get().addLog(`${state.character.name} discards ${cardDefId} (A-side) to negate damage`);

    const afterState = state.afterDamageState ?? {};
    set({
      ...afterState,
      character: { ...state.character, cards: updatedCards },
      pendingDamage: null,
      afterDamageState: null,
    });
  },

  negateDamageDiscard2B: (cardDefId1: string, cardDefId2: string) => {
    const state = get();
    if (state.pendingDamage === null) return;
    const updatedCards = negateByDiscard2B(state.character.cards, cardDefId1, cardDefId2);
    get().addLog(`${state.character.name} discards 2 B-side cards to negate damage`);

    const afterState = state.afterDamageState ?? {};
    set({
      ...afterState,
      character: { ...state.character, cards: updatedCards },
      pendingDamage: null,
      afterDamageState: null,
    });
  },

  negateDamageLoseCard: (cardDefId: string) => {
    const state = get();
    if (state.pendingDamage === null) return;
    const updatedCards = negateByLoseCard(state.character.cards, cardDefId);
    get().addLog(`${state.character.name} loses ${cardDefId} to negate damage`);

    const afterState = state.afterDamageState ?? {};
    set({
      ...afterState,
      character: { ...state.character, cards: updatedCards },
      pendingDamage: null,
      afterDamageState: null,
    });
  },

  // ─── Rest ───────────────────────────────────────────────────

  performShortRestAction: () => {
    const state = get();
    const result = performShortRest(state.character.cards);
    set({
      character: { ...state.character, cards: result.cards },
      shortRestLostCardId: result.lostCardId,
      shortRestRerolled: false,
    });
    if (result.lostCardId) {
      get().addLog(`Short rest: randomly lost ${result.lostCardId}`);
    }
  },

  shortRestRerollAction: () => {
    const state = get();
    if (!state.shortRestLostCardId || state.shortRestRerolled) return;

    const result = shortRestReroll(state.character.cards, state.shortRestLostCardId);
    const newHP = applyDamageToCharacter(state.character.currentHP, 1);

    set({
      character: { ...state.character, cards: result.cards, currentHP: newHP },
      shortRestLostCardId: result.newLostCardId,
      shortRestRerolled: true,
    });
    get().addLog(`Short rest reroll: suffer 1 damage, now lost ${result.newLostCardId} instead`);

    if (newHP <= 0) {
      set({ phase: 'SCENARIO_FAILED', playerTurnSubPhase: null });
      get().addLog('You have been defeated...');
    }
  },

  // ─── Long Rest ─────────────────────────────────────────────

  declareLongRest: () => {
    const state = get();
    // Long rest = initiative 99, enters turn order normally
    const turnOrder = buildTurnOrder(99, state.monsterDefs, state.monsters);
    const nextIdx = getNextTurnIndex(turnOrder);
    const nextEntry = turnOrder[nextIdx];

    set({ isLongResting: true });

    // Mark character as resting (no cards selected)
    const updatedCharacter = {
      ...state.character,
      selectedCards: null,
      initiativeCard: null,
      topCardId: null,
      bottomCardId: null,
      executedTop: false,
      executedBottom: false,
    };

    if (nextEntry?.entityType === 'character') {
      // Character goes first (very unlikely at initiative 99 but possible)
      set({
        turnOrder,
        currentTurnIndex: nextIdx,
        phase: 'RESTING',
        playerTurnSubPhase: null,
        character: updatedCharacter,
      });
    } else {
      set({
        turnOrder,
        currentTurnIndex: nextIdx,
        phase: 'MONSTER_TURN',
        playerTurnSubPhase: null,
        character: updatedCharacter,
      });
    }

    get().addLog(`${state.character.name} declares Long Rest (initiative 99)`);
    get().addLog(`Initiative: ${turnOrder.map(e => `${e.entityId}(${e.initiative})`).join(', ')}`);
  },

  confirmLongRestLoss: (cardDefId: string) => {
    const state = get();
    const updatedCards = performLongRestRecovery(state.character.cards, cardDefId);
    // Heal 2
    const newHP = Math.min(state.character.maxHP, state.character.currentHP + 2);
    // Recover spent items
    const recoveredItems = state.character.items.map(i => i.isSpent ? { ...i, isSpent: false } : i);
    const recoveredCount = state.character.items.filter(i => i.isSpent).length;
    if (recoveredCount > 0) {
      get().addLog(`Long rest: recovered ${recoveredCount} spent item(s)`);
    }
    get().addLog(`Long rest: lost ${cardDefId}, healed to ${newHP} HP`);

    // Advance turn after rest
    const turnOrder = resolveTurn(state.turnOrder, state.currentTurnIndex);
    const nextIdx = getNextTurnIndex(turnOrder);

    if (nextIdx === -1) {
      set({
        character: { ...state.character, cards: updatedCards, currentHP: newHP, items: recoveredItems },
        turnOrder,
        phase: 'END_OF_ROUND',
        playerTurnSubPhase: null,
      });
    } else {
      const nextEntry = turnOrder[nextIdx];
      set({
        character: { ...state.character, cards: updatedCards, currentHP: newHP, items: recoveredItems },
        turnOrder,
        currentTurnIndex: nextIdx,
        phase: nextEntry.entityType === 'character' ? 'PLAYER_TURN' : 'MONSTER_TURN',
        playerTurnSubPhase: nextEntry.entityType === 'character' ? 'CHOOSING_ACTION' : null,
      });
    }
  },

  // ─── Items ──────────────────────────────────────────────────

  useItem: (itemDefId: string) => {
    const state = get();
    const itemState = state.character.items.find(i => i.defId === itemDefId);
    const itemDef = state.character.itemDefs.find(d => d.id === itemDefId);
    if (!itemState || !itemDef || itemState.isSpent || itemState.isLost) return;

    // Apply item effects
    let updatedCharacter = { ...state.character };
    for (const action of itemDef.actions) {
      switch (action.type) {
        case 'heal': {
          const healAmount = action.value ?? 0;
          updatedCharacter = {
            ...updatedCharacter,
            currentHP: Math.min(updatedCharacter.maxHP, updatedCharacter.currentHP + healAmount),
          };
          get().addLog(`${updatedCharacter.name} uses ${itemDef.name}: heals ${healAmount}`);
          break;
        }
        case 'shield': {
          updatedCharacter = {
            ...updatedCharacter,
            activeShield: updatedCharacter.activeShield + (action.value ?? 0),
          };
          get().addLog(`${updatedCharacter.name} uses ${itemDef.name}: Shield ${action.value}`);
          break;
        }
        default:
          get().addLog(`${updatedCharacter.name} uses ${itemDef.name}`);
          break;
      }
    }

    // Mark item as spent or lost
    const updatedItems = updatedCharacter.items.map(i => {
      if (i.defId === itemDefId) {
        if (itemDef.usage === 'lost') return { ...i, isLost: true };
        if (itemDef.usage === 'spent') return { ...i, isSpent: true };
      }
      return i;
    });

    set({ character: { ...updatedCharacter, items: updatedItems } });
  },

  // ─── Reset ──────────────────────────────────────────────────

  resetGame: () => {
    set({
      phase: 'SCENARIO_SETUP',
      playerTurnSubPhase: null,
      round: 0,
      hexMap: { cells: new Map() },
      character: createEmptyCharacter(),
      monsterDefs: new Map(),
      monsters: new Map(),
      turnOrder: [],
      currentTurnIndex: 0,
      reachableHexes: null,
      validAttackTargets: null,
      currentAction: null,
      log: [],
      pendingActions: [],
      pendingActionIndex: 0,
      lastAttackTargetId: null,
      monsterRoundBonuses: new Map(),
      infusedElements: new Set<ElementType>(),
      pendingDamage: null,
      pendingDamageSource: '',
      afterDamageState: null,
      shortRestLostCardId: null,
      shortRestRerolled: false,
      isLongResting: false,
      remainingTargets: 0,
      selectedTargetIds: [],
      actionOrder: 'top_first' as const,
      modifierPopup: null,
      attackAnimation: null,
      monsterStepQueue: [],
      monsterStepIndex: 0,
      monsterStepPhase: null,
      monsterStepLogs: [],
      monsterAccumulatedDamage: 0,
    });
  },
}));

// ─── Helper functions for action execution ────────────────────────

type SetFn = (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void;
type GetFn = () => GameStore;

function executeNextAction(get: GetFn, set: SetFn, action: AbilityAction) {
  const state = get();
  const { character, hexMap, monsters } = state;

  switch (action.type) {
    case 'move': {
      // Immobilize check
      if (hasCondition(character.conditions, 'immobilize')) {
        get().addLog(`${character.name} is immobilized — cannot move!`);
        advanceAction(get, set);
        return;
      }

      const movePoints = action.value ?? 2;
      const blocked = getCharacterBlockedHexes(monsters);
      const reachable = getReachableHexes(character.position, movePoints, hexMap, blocked, action.jump);
      const reachableSet = new Set(reachable.keys());

      set({
        playerTurnSubPhase: 'SELECTING_MOVE_HEX',
        reachableHexes: reachableSet,
        currentAction: action,
      });
      break;
    }

    case 'attack': {
      // Disarm check
      if (hasCondition(character.conditions, 'disarm')) {
        get().addLog(`${character.name} is disarmed — cannot attack!`);
        advanceAction(get, set);
        return;
      }

      const range = action.range ?? 1;
      const targetCount = action.target ?? 1;
      const targets = getValidAttackTargets(character.position, range, hexMap, monsters);

      if (targets.length === 0) {
        get().addLog('No valid targets in range.');
        advanceAction(get, set);
        return;
      }

      set({
        playerTurnSubPhase: 'SELECTING_ATTACK_TARGET',
        validAttackTargets: targets,
        currentAction: action,
        remainingTargets: targetCount,
        selectedTargetIds: [],
      });
      break;
    }

    case 'heal': {
      const healAmount = action.value ?? 0;
      const healResult = processHealWithConditions(
        character.conditions,
        healAmount,
        character.currentHP,
        character.maxHP,
      );
      for (const l of healResult.logs) {
        get().addLog(`${character.name}: ${l}`);
      }
      set({
        character: {
          ...character,
          currentHP: healResult.newHP,
          conditions: healResult.newConditions,
        },
      });
      advanceAction(get, set);
      break;
    }

    case 'shield': {
      const shieldValue = action.value ?? 0;
      set({ character: { ...character, activeShield: character.activeShield + shieldValue } });
      get().addLog(`${character.name} gains Shield ${shieldValue}`);
      advanceAction(get, set);
      break;
    }

    case 'retaliate': {
      const retValue = action.value ?? 0;
      const retRange = action.range ?? 1;
      set({
        character: {
          ...character,
          activeRetaliate: character.activeRetaliate + retValue,
          activeRetaliateRange: Math.max(character.activeRetaliateRange, retRange),
        },
      });
      get().addLog(`${character.name} gains Retaliate ${retValue}${retRange > 1 ? ` Range ${retRange}` : ''}`);
      advanceAction(get, set);
      break;
    }

    case 'push': {
      const pushAmount = action.value ?? 1;
      const targetId = state.lastAttackTargetId;
      if (!targetId) {
        advanceAction(get, set);
        break;
      }
      const target = monsters.get(targetId);
      if (!target || target.currentHP <= 0) {
        advanceAction(get, set);
        break;
      }
      const occupied = new Set<string>();
      for (const m of monsters.values()) {
        if (m.currentHP > 0 && m.instanceId !== targetId) occupied.add(hexKey(m.position));
      }
      occupied.add(hexKey(character.position));
      const pushResult = calculatePushDestination(target.position, character.position, pushAmount, hexMap, occupied);
      if (hexKey(pushResult.finalPos) !== hexKey(target.position)) {
        const newMonsters = new Map(monsters);
        let pushedMonster = { ...target, position: pushResult.finalPos };
        if (pushResult.hazardDamage > 0) {
          pushedMonster = applyDamageToMonster(pushedMonster, pushResult.hazardDamage);
          get().addLog(`${target.defId} pushed into hazard for ${pushResult.hazardDamage} damage!`);
        }
        newMonsters.set(targetId, pushedMonster);
        set({ monsters: newMonsters });
        get().addLog(`${target.defId} pushed ${pushAmount}`);
        if (pushedMonster.currentHP <= 0) {
          get().addLog(`${target.defId} ${target.instanceId} is defeated!`);
          if (checkKillAllObjective(newMonsters)) {
            set({ phase: 'SCENARIO_COMPLETE', playerTurnSubPhase: null });
            get().addLog('All enemies defeated! Victory!');
            return;
          }
        }
      }
      advanceAction(get, set);
      break;
    }

    case 'pull': {
      const pullAmount = action.value ?? 1;
      const targetId = state.lastAttackTargetId;
      if (!targetId) {
        advanceAction(get, set);
        break;
      }
      const target = monsters.get(targetId);
      if (!target || target.currentHP <= 0) {
        advanceAction(get, set);
        break;
      }
      const occupied = new Set<string>();
      for (const m of monsters.values()) {
        if (m.currentHP > 0 && m.instanceId !== targetId) occupied.add(hexKey(m.position));
      }
      occupied.add(hexKey(character.position));
      const pullResult = calculatePullDestination(target.position, character.position, pullAmount, hexMap, occupied);
      if (hexKey(pullResult.finalPos) !== hexKey(target.position)) {
        const newMonsters = new Map(monsters);
        let pulledMonster = { ...target, position: pullResult.finalPos };
        if (pullResult.hazardDamage > 0) {
          pulledMonster = applyDamageToMonster(pulledMonster, pullResult.hazardDamage);
          get().addLog(`${target.defId} pulled into hazard for ${pullResult.hazardDamage} damage!`);
        }
        newMonsters.set(targetId, pulledMonster);
        set({ monsters: newMonsters });
        get().addLog(`${target.defId} pulled ${pullAmount}`);
        if (pulledMonster.currentHP <= 0) {
          get().addLog(`${target.defId} ${target.instanceId} is defeated!`);
          if (checkKillAllObjective(newMonsters)) {
            set({ phase: 'SCENARIO_COMPLETE', playerTurnSubPhase: null });
            get().addLog('All enemies defeated! Victory!');
            return;
          }
        }
      }
      advanceAction(get, set);
      break;
    }

    case 'element_infuse': {
      if (action.element) {
        const updated = infuseElement(state.infusedElements, action.element);
        set({ infusedElements: updated });
        get().addLog(`${character.name} infuses ${action.element}`);
      }
      advanceAction(get, set);
      break;
    }

    case 'element_consume': {
      if (action.element) {
        const result = consumeElement(state.infusedElements, action.element);
        if (result.success) {
          set({ infusedElements: result.updated });
          get().addLog(`${character.name} consumes ${action.element}`);
        } else {
          get().addLog(`${action.element} not available — consume skipped`);
        }
      }
      advanceAction(get, set);
      break;
    }

    case 'condition': {
      // Self-applied condition (e.g. from a card ability, not attached to attack)
      if (action.condition) {
        get().addLog(`${character.name} performs ${action.condition}`);
      }
      advanceAction(get, set);
      break;
    }

    default: {
      get().addLog(`${character.name} performs ${action.type} ${action.value ?? ''}`);
      advanceAction(get, set);
      break;
    }
  }
}

function advanceAction(get: GetFn, set: SetFn) {
  const state = get();
  const nextIndex = state.pendingActionIndex + 1;

  if (nextIndex < state.pendingActions.length) {
    set({ pendingActionIndex: nextIndex });
    executeNextAction(get, set, state.pendingActions[nextIndex]);
  } else {
    // Both actions done
    set({
      playerTurnSubPhase: 'TURN_COMPLETE',
      pendingActions: [],
      pendingActionIndex: 0,
      currentAction: null,
      reachableHexes: null,
      validAttackTargets: null,
    });
  }
}
