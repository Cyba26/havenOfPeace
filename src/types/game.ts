import type { AxialCoord, HexMap } from './hex';
import type { AbilityCardDef, CardState, AbilityAction, ConditionType, ElementType } from './cards';
import type { MonsterInstance, MonsterDef } from './monsters';
import type { ItemDef, ItemState } from './items';

export type GamePhase =
  | 'SCENARIO_SETUP'
  | 'CARD_SELECTION'
  | 'INITIATIVE_RESOLUTION'
  | 'PLAYER_TURN'
  | 'MONSTER_TURN'
  | 'END_OF_ROUND'
  | 'RESTING'
  | 'SCENARIO_COMPLETE'
  | 'SCENARIO_FAILED';

export type PlayerTurnSubPhase =
  | 'CHOOSING_ACTION'       // player assigns top/bottom from selected cards
  | 'EXECUTING_TOP'         // executing the top action
  | 'EXECUTING_BOTTOM'      // executing the bottom action
  | 'SELECTING_MOVE_HEX'   // waiting for player to click a reachable hex
  | 'SELECTING_ATTACK_TARGET' // waiting for player to click a target
  | 'TURN_COMPLETE';       // both actions done, end turn

export interface InitiativeEntry {
  entityType: 'character' | 'monster_group';
  entityId: string;         // 'character' or monster def id like 'guard'
  initiative: number;
  resolved: boolean;
  /** For monster groups, the action column index rolled (0, 1, or 2) */
  actionIndex?: number;
}

export interface CharacterState {
  name: string;
  position: AxialCoord;
  currentHP: number;
  maxHP: number;
  level: number;
  conditions: ConditionType[];
  cardDefs: AbilityCardDef[];
  cards: CardState[];
  /** Currently selected cards for the round [card1Id, card2Id] or null */
  selectedCards: [string, string] | null;
  /** Which selected card determines initiative */
  initiativeCard: string | null;
  /** Which card's top action to use */
  topCardId: string | null;
  /** Which card's bottom action to use */
  bottomCardId: string | null;
  /** Track if top/bottom actions have been executed this turn */
  executedTop: boolean;
  executedBottom: boolean;
  /** Attack modifier table (same format as monsters) */
  modifierTable: number[];
  modifierRow: number;
  /** Active shield value (from card abilities, round bonus) */
  activeShield: number;
  /** Active retaliate value */
  activeRetaliate: number;
  /** Active retaliate range (default 1 = adjacent) */
  activeRetaliateRange: number;
  /** Equipped item definitions */
  itemDefs: ItemDef[];
  /** Equipped item states */
  items: ItemState[];
  /** Bonus movement from items (resets at end of turn) */
  moveBonus: number;
  /** Bonus attack from items (resets at end of turn) */
  attackBonus: number;
}

export interface GameState {
  phase: GamePhase;
  playerTurnSubPhase: PlayerTurnSubPhase | null;
  round: number;
  hexMap: HexMap;
  character: CharacterState;
  /** Monster definitions loaded for this scenario */
  monsterDefs: Map<string, MonsterDef>;
  /** Active monster instances */
  monsters: Map<string, MonsterInstance>;
  /** Turn order for current round */
  turnOrder: InitiativeEntry[];
  currentTurnIndex: number;
  /** UI state: reachable hexes for movement highlight */
  reachableHexes: Set<string> | null;
  /** UI state: valid attack target instance IDs */
  validAttackTargets: string[] | null;
  /** Current action being executed (for resolving sub-phases) */
  currentAction: AbilityAction | null;
  /** Game log entries */
  log: string[];
  /** Scenario objective type */
  objectiveType: 'kill_all';
  /** Currently infused elements available for consumption */
  infusedElements: Set<ElementType>;
}
