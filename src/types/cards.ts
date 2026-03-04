export type ActionType =
  | 'attack'
  | 'move'
  | 'heal'
  | 'shield'
  | 'retaliate'
  | 'push'
  | 'pull'
  | 'condition'
  | 'loot'
  | 'element_infuse'
  | 'element_consume';

export type ConditionType =
  | 'wound'
  | 'poison'
  | 'immobilize'
  | 'disarm'
  | 'muddle'
  | 'invisible'
  | 'strengthen';

export type ElementType = 'fire' | 'ice' | 'air' | 'earth' | 'light' | 'dark';

export interface AbilityAction {
  type: ActionType;
  value?: number;           // attack value, move points, heal amount, etc.
  range?: number;           // attack range (undefined = melee = 1)
  target?: number;          // number of targets (default 1)
  jump?: boolean;           // movement ignores obstacles
  piercing?: number;        // reduces shield
  condition?: ConditionType;
  element?: ElementType;
  aoe?: AoePattern;         // area of effect hex offsets
}

/** Area of effect pattern: offsets relative to target hex */
export interface AoePattern {
  hexes: { dq: number; dr: number }[];
}

export interface ActionHalf {
  actions: AbilityAction[];
  isLost: boolean;          // card goes to lost pile after use
}

export interface CardSide {
  top: ActionHalf;
  bottom: ActionHalf;
  initiative: number;
}

export interface AbilityCardDef {
  id: string;
  name: string;
  level: number;            // 1 or 2
  sideA: CardSide;
  sideB: CardSide;
}

export type CardLocation = 'hand' | 'discard' | 'lost' | 'active';
export type CardFace = 'A' | 'B';

export interface CardState {
  defId: string;
  currentSide: CardFace;
  location: CardLocation;
}
