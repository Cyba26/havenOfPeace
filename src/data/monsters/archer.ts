import type { MonsterDef } from '@/types/monsters';

export const ARCHER_DEF: MonsterDef = {
  id: 'archer',
  name: 'Archer',
  isRanged: true,
  baseAttack: 2,
  baseMove: 1,
  baseHP: 3,
  eliteHP: 5,
  actions: [
    // Column 1: Move + Ranged attack
    {
      initiative: 40,
      abilities: [
        { type: 'move', value: 1 },
        { type: 'attack', value: 2, range: 3 },
      ],
    },
    // Column 2: Strong ranged attack
    {
      initiative: 65,
      abilities: [
        { type: 'attack', value: 3, range: 4 },
      ],
    },
    // Column 3: Move away + ranged attack
    {
      initiative: 20,
      abilities: [
        { type: 'move', value: 2 },
        { type: 'attack', value: 1, range: 3 },
      ],
    },
  ],
  modifierTable: [
    0, +1, -1, 0, 0, +1, -1, 0,
    -2, +1, 0, 0, +2, -1, 0, -1,
  ],
};
