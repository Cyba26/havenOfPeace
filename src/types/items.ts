import type { AbilityAction } from './cards';

export type ItemSlot = 'single-hand' | 'dual-hand' | 'generic';
export type ItemUsage = 'passive' | 'spent' | 'lost';

export interface ItemDef {
  id: string;
  name: string;
  slot: ItemSlot;
  usage: ItemUsage;
  /** Actions/effects when used */
  actions: AbilityAction[];
  /** Description for display */
  description: string;
}

export interface ItemState {
  defId: string;
  /** Whether this item has been used (spent) this scenario */
  isSpent: boolean;
  /** Whether this item is permanently lost for the scenario */
  isLost: boolean;
}
