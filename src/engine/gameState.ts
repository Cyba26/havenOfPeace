import type { GamePhase } from '@/types/game';
import type { CardState } from '@/types/cards';
import type { MonsterInstance } from '@/types/monsters';

/** Valid phase transitions */
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  SCENARIO_SETUP: ['CARD_SELECTION'],
  CARD_SELECTION: ['INITIATIVE_RESOLUTION', 'RESTING'],
  INITIATIVE_RESOLUTION: ['PLAYER_TURN', 'MONSTER_TURN'],
  PLAYER_TURN: ['PLAYER_TURN', 'MONSTER_TURN', 'END_OF_ROUND', 'SCENARIO_COMPLETE', 'SCENARIO_FAILED'],
  MONSTER_TURN: ['PLAYER_TURN', 'MONSTER_TURN', 'END_OF_ROUND', 'SCENARIO_COMPLETE', 'SCENARIO_FAILED'],
  END_OF_ROUND: ['CARD_SELECTION', 'SCENARIO_FAILED'],
  RESTING: ['CARD_SELECTION', 'SCENARIO_FAILED'],
  SCENARIO_COMPLETE: ['SCENARIO_SETUP'],
  SCENARIO_FAILED: ['SCENARIO_SETUP'],
};

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: GamePhase, to: GamePhase): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid phase transition: ${from} -> ${to}`);
  }
}

/** Check if character is exhausted (can't continue) */
export function isExhausted(hp: number, cards: CardState[]): boolean {
  if (hp <= 0) return true;
  const handCards = cards.filter(c => c.location === 'hand');
  return handCards.length < 2;
}

/** Check if all monsters are dead */
export function allMonstersDead(monsters: Map<string, MonsterInstance>): boolean {
  for (const m of monsters.values()) {
    if (m.currentHP > 0) return false;
  }
  return true;
}

/** Check kill_all objective: all monsters eliminated */
export function checkKillAllObjective(monsters: Map<string, MonsterInstance>): boolean {
  for (const m of monsters.values()) {
    if (m.currentHP > 0) return false;
  }
  return true;
}
