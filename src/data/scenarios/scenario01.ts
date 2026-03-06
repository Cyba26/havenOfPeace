import type { ScenarioDef } from '@/types/scenario';

/**
 * Scenario 01: The Gatehouse
 * A small introductory scenario: clear the guards blocking the passage.
 *
 * Hex layout (flat-top, axial coordinates):
 *
 *        (-1,-1) (0,-1) (1,-1)
 *     (-2,0) (-1,0) (0,0) (1,0) (2,0)
 *        (-1,1)  (0,1)  (1,1)
 *     (-2,1) (-1,2) (0,2) (1,2) (2,1)
 *                  (0,3)
 *
 * Character starts at (-2,0) (west side)
 * Monsters on the east side
 */
export const SCENARIO_01: ScenarioDef = {
  id: 'scenario-01',
  name: 'Le Corps de Garde',
  description: '\u00c9liminez les gardes qui bloquent le passage du vieux corps de garde.',
  characterStart: { q: -2, r: 1 },
  objectiveType: 'kill_all',
  requiredMonsters: ['guard', 'archer'],
  hexes: [
    // Row 1 (top)
    { q: -1, r: -1, terrain: 'empty' },
    { q: 0, r: -1, terrain: 'obstacle' }, // pillar
    { q: 1, r: -1, terrain: 'empty' },

    // Row 2
    { q: -2, r: 0, terrain: 'empty' },
    { q: -1, r: 0, terrain: 'empty' },
    { q: 0, r: 0, terrain: 'empty' },
    { q: 1, r: 0, terrain: 'empty' },
    { q: 2, r: 0, terrain: 'empty' },

    // Row 3
    { q: -1, r: 1, terrain: 'empty' },
    { q: 0, r: 1, terrain: 'hazard', hazardDamage: 1 }, // fire trap
    { q: 1, r: 1, terrain: 'empty' },

    // Row 4
    { q: -2, r: 1, terrain: 'empty', isStartingHex: true },
    { q: -1, r: 2, terrain: 'difficult' }, // rubble
    { q: 0, r: 2, terrain: 'empty' },
    { q: 1, r: 2, terrain: 'empty' },
    { q: 2, r: 1, terrain: 'empty' },

    // Row 5 (bottom alcove)
    { q: 0, r: 3, terrain: 'empty' },
  ],
  monsters: [
    { defId: 'guard', position: { q: 1, r: 0 }, isElite: false },
    { defId: 'guard', position: { q: 2, r: 0 }, isElite: false },
    { defId: 'archer', position: { q: 2, r: 1 }, isElite: false },
  ],
};
