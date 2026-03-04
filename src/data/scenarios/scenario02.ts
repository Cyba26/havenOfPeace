import type { ScenarioDef } from '@/types/scenario';

/**
 * Scenario 02: The Ambush
 * A larger scenario with an elite guard, mixed enemies, and more terrain.
 *
 * Hex layout (axial coordinates):
 *
 *          (-1,-2) (0,-2) (1,-2)
 *     (-2,-1) (-1,-1) (0,-1) (1,-1) (2,-1)
 *          (-1,0)  (0,0)  (1,0)
 *     (-2,0) (-1,1) (0,1) (1,1) (2,0)
 *          (-1,2)  (0,2)  (1,2)
 *     (-2,1) (-1,3) (0,3) (1,3) (2,1)
 *
 * Character starts at (-2,0), enemies spread across the map
 */
export const SCENARIO_02: ScenarioDef = {
  id: 'scenario-02',
  name: 'The Ambush',
  description: 'Fight through an ambush of guards and archers in the narrow corridor.',
  characterStart: { q: -2, r: 0 },
  objectiveType: 'kill_all',
  requiredMonsters: ['guard', 'archer'],
  hexes: [
    // Top row
    { q: -1, r: -2, terrain: 'empty' },
    { q: 0, r: -2, terrain: 'empty' },
    { q: 1, r: -2, terrain: 'obstacle' },

    // Row 2
    { q: -2, r: -1, terrain: 'empty' },
    { q: -1, r: -1, terrain: 'empty' },
    { q: 0, r: -1, terrain: 'hazard', hazardDamage: 1 },
    { q: 1, r: -1, terrain: 'empty' },
    { q: 2, r: -1, terrain: 'empty' },

    // Row 3
    { q: -1, r: 0, terrain: 'empty' },
    { q: 0, r: 0, terrain: 'empty' },
    { q: 1, r: 0, terrain: 'difficult' },

    // Row 4
    { q: -2, r: 0, terrain: 'empty', isStartingHex: true },
    { q: -1, r: 1, terrain: 'empty' },
    { q: 0, r: 1, terrain: 'empty' },
    { q: 1, r: 1, terrain: 'empty' },
    { q: 2, r: 0, terrain: 'empty' },

    // Row 5
    { q: -1, r: 2, terrain: 'obstacle' },
    { q: 0, r: 2, terrain: 'empty' },
    { q: 1, r: 2, terrain: 'empty' },

    // Row 6
    { q: -2, r: 1, terrain: 'empty' },
    { q: -1, r: 3, terrain: 'empty' },
    { q: 0, r: 3, terrain: 'hazard', hazardDamage: 2 },
    { q: 1, r: 3, terrain: 'empty' },
    { q: 2, r: 1, terrain: 'empty' },
  ],
  monsters: [
    { defId: 'guard', position: { q: 0, r: 0 }, isElite: true },
    { defId: 'guard', position: { q: 1, r: -1 }, isElite: false },
    { defId: 'archer', position: { q: 2, r: -1 }, isElite: false },
    { defId: 'archer', position: { q: 2, r: 0 }, isElite: false },
  ],
};
