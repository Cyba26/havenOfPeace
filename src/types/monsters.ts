import type { AbilityAction } from './cards';
import type { AxialCoord } from './hex';
import type { ConditionType } from './cards';

/** A single action a monster can perform in a round */
export interface MonsterAction {
  initiative: number;
  abilities: AbilityAction[];
}

/** Attack modifier table row: [column1, column2, column3, ...] */
export type ModifierRow = number[]; // each value: -2, -1, 0, +1, +2, or 99 (miss), 100 (x2)

export const MODIFIER_MISS = 99;
export const MODIFIER_X2 = 100;

/** Monster type definition (shared across all instances of this type) */
export interface MonsterDef {
  id: string;
  name: string;
  isRanged: boolean;
  baseAttack: number;
  baseMove: number;
  baseHP: number;
  eliteHP: number;
  shield?: number;
  retaliate?: number;
  retaliateRange?: number;
  /** 3 action columns, each with initiative + abilities */
  actions: [MonsterAction, MonsterAction, MonsterAction];
  /** 6-row modifier table (rolled top to bottom, wraps) */
  modifierTable: ModifierRow;
}

/** A specific monster on the board */
export interface MonsterInstance {
  instanceId: string;       // unique: "guard-1", "archer-2"
  defId: string;            // references MonsterDef.id
  isElite: boolean;
  currentHP: number;
  maxHP: number;
  position: AxialCoord;
  conditions: ConditionType[];
  modifierRow: number;      // current position in modifier table
}
