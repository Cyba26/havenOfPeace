import type { AbilityCardDef } from '@/types/cards';
import { MODIFIER_MISS, MODIFIER_X2 } from '@/types/monsters';

/** Bruiser: tanky melee character, 10 HP */
export const BRUISER_MAX_HP = 10;
export const BRUISER_NAME = 'Bruiser';

/**
 * Bruiser modifier table (standard deck, 16 values):
 * 6x +0, 4x +1, 4x -1, 1x +2, 1x -2, shuffled conceptually.
 * For the tracker cube system, we use a fixed sequence.
 */
export const BRUISER_MODIFIER_TABLE: number[] = [
  0, +1, -1, 0, +1, 0, -1, +2,
  0, -1, +1, 0, -2, +1, -1, 0,
];

export const BRUISER_CARDS: AbilityCardDef[] = [
  {
    id: 'bruiser-01',
    name: 'Crushing Blow',
    level: 1,
    sideA: {
      top: { actions: [{ type: 'attack', value: 3 }], isLost: false },
      bottom: { actions: [{ type: 'move', value: 2 }], isLost: false },
      initiative: 25,
    },
    sideB: {
      top: { actions: [{ type: 'attack', value: 2 }, { type: 'push', value: 1 }], isLost: false },
      bottom: { actions: [{ type: 'move', value: 3 }], isLost: false },
      initiative: 40,
    },
  },
  {
    id: 'bruiser-02',
    name: 'Iron Stance',
    level: 1,
    sideA: {
      top: { actions: [{ type: 'attack', value: 2 }], isLost: false },
      bottom: { actions: [{ type: 'move', value: 2 }, { type: 'shield', value: 1 }], isLost: false },
      initiative: 35,
    },
    sideB: {
      top: { actions: [{ type: 'attack', value: 4 }], isLost: true },
      bottom: { actions: [{ type: 'heal', value: 3 }], isLost: false },
      initiative: 60,
    },
  },
  {
    id: 'bruiser-03',
    name: 'Sweeping Strike',
    level: 1,
    sideA: {
      top: { actions: [{ type: 'attack', value: 2, target: 2 }], isLost: false },
      bottom: { actions: [{ type: 'move', value: 3 }], isLost: false },
      initiative: 15,
    },
    sideB: {
      top: { actions: [{ type: 'attack', value: 3, piercing: 1 }], isLost: false },
      bottom: { actions: [{ type: 'move', value: 2, jump: true }], isLost: false },
      initiative: 50,
    },
  },
  {
    id: 'bruiser-04',
    name: 'Battle Fury',
    level: 1,
    sideA: {
      top: { actions: [{ type: 'attack', value: 2 }, { type: 'condition', condition: 'wound' }], isLost: false },
      bottom: { actions: [{ type: 'move', value: 4 }], isLost: false },
      initiative: 20,
    },
    sideB: {
      top: { actions: [{ type: 'attack', value: 5 }], isLost: true },
      bottom: { actions: [{ type: 'move', value: 3 }, { type: 'attack', value: 2 }], isLost: true },
      initiative: 70,
    },
  },
];
