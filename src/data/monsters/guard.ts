import type { MonsterDef } from '@/types/monsters';
import { MODIFIER_MISS, MODIFIER_X2 } from '@/types/monsters';

export const GUARD_DEF: MonsterDef = {
  id: 'guard',
  name: 'Garde',
  isRanged: false,
  baseAttack: 2,
  baseMove: 2,
  baseHP: 5,
  eliteHP: 8,
  shield: 0,
  actions: [
    // Column 1: Move + Attack
    {
      initiative: 30,
      abilities: [
        { type: 'move', value: 2 },
        { type: 'attack', value: 2 },
      ],
    },
    // Column 2: Strong attack, no move
    {
      initiative: 50,
      abilities: [
        { type: 'attack', value: 3 },
      ],
    },
    // Column 3: Shield + Move + Attack
    {
      initiative: 15,
      abilities: [
        { type: 'shield', value: 1 },
        { type: 'move', value: 1 },
        { type: 'attack', value: 2 },
      ],
    },
  ],
  modifierTable: [
    0, +1, -1, 0, +1, 0, -1, 0,
    +2, -1, 0, +1, -2, 0, -1, 0,
  ],
};
