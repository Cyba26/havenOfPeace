import { BRUISER_CARDS, BRUISER_MAX_HP, BRUISER_NAME, BRUISER_MODIFIER_TABLE } from './characters/bruiser';
import { GUARD_DEF } from './monsters/guard';
import { ARCHER_DEF } from './monsters/archer';
import { SCENARIO_01 } from './scenarios/scenario01';
import { SCENARIO_02 } from './scenarios/scenario02';
import { generateRandomScenario } from './scenarios/scenario03-random';
import { ALL_ITEMS } from './items/starter';
import type { MonsterDef } from '@/types/monsters';
import type { ScenarioDef } from '@/types/scenario';
import type { ItemDef } from '@/types/items';

export { generateRandomScenario } from './scenarios/scenario03-random';

// ─── Character registry ───────────────────────────────────────────

export const CHARACTERS = {
  bruiser: {
    name: BRUISER_NAME,
    maxHP: BRUISER_MAX_HP,
    cards: BRUISER_CARDS,
    modifierTable: BRUISER_MODIFIER_TABLE,
  },
} as const;

// ─── Monster registry ─────────────────────────────────────────────

export const MONSTER_DEFS: Record<string, MonsterDef> = {
  guard: GUARD_DEF,
  archer: ARCHER_DEF,
};

// ─── Scenario registry ────────────────────────────────────────────

export const SCENARIOS: Record<string, ScenarioDef> = {
  'scenario-01': SCENARIO_01,
  'scenario-02': SCENARIO_02,
};

// ─── Item registry ───────────────────────────────────────────────

export const ITEMS: Record<string, ItemDef> = ALL_ITEMS;
