import type { InitiativeEntry } from '@/types/game';
import type { MonsterInstance, MonsterDef } from '@/types/monsters';
import type { AbilityCardDef, CardState } from '@/types/cards';
import { getCardInitiative } from './cards';
import { rollMonsterAction } from './monsterAI';

/**
 * Build turn order for a round.
 * - Character initiative from their selected initiative card
 * - Each monster TYPE rolls one action (shared by all instances of that type)
 * - Sort by initiative ascending; character wins ties
 */
export function buildTurnOrder(
  characterInitiative: number,
  monsterDefs: Map<string, MonsterDef>,
  monsters: Map<string, MonsterInstance>,
): InitiativeEntry[] {
  const entries: InitiativeEntry[] = [];

  // Character entry
  entries.push({
    entityType: 'character',
    entityId: 'character',
    initiative: characterInitiative,
    resolved: false,
  });

  // Group monsters by type
  const monsterTypes = new Set<string>();
  for (const m of monsters.values()) {
    if (m.currentHP > 0) {
      monsterTypes.add(m.defId);
    }
  }

  // Roll action for each monster type
  for (const defId of monsterTypes) {
    const def = monsterDefs.get(defId);
    if (!def) continue;

    // Check if any instance of this type is elite (for double turn)
    const hasElite = Array.from(monsters.values()).some(
      m => m.defId === defId && m.isElite && m.currentHP > 0,
    );

    if (hasElite) {
      // Elite monsters get TWO turns with different action columns
      const indices = [0, 1, 2];
      // Shuffle and pick 2
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const idx1 = indices[0];
      const idx2 = indices[1];

      entries.push({
        entityType: 'monster_group',
        entityId: defId,
        initiative: def.actions[idx1].initiative,
        resolved: false,
        actionIndex: idx1,
      });
      entries.push({
        entityType: 'monster_group',
        entityId: defId,
        initiative: def.actions[idx2].initiative,
        resolved: false,
        actionIndex: idx2,
      });
    } else {
      const { actionIndex, action } = rollMonsterAction(def);
      entries.push({
        entityType: 'monster_group',
        entityId: defId,
        initiative: action.initiative,
        resolved: false,
        actionIndex,
      });
    }
  }

  // Sort: lowest initiative first, character wins ties
  entries.sort((a, b) => {
    if (a.initiative !== b.initiative) return a.initiative - b.initiative;
    // Character wins ties
    if (a.entityType === 'character') return -1;
    if (b.entityType === 'character') return 1;
    return 0;
  });

  return entries;
}

/**
 * Get the next unresolved turn index, or -1 if round is complete.
 */
export function getNextTurnIndex(turnOrder: InitiativeEntry[]): number {
  return turnOrder.findIndex(e => !e.resolved);
}

/**
 * Check if the round is complete (all turns resolved).
 */
export function isRoundComplete(turnOrder: InitiativeEntry[]): boolean {
  return turnOrder.every(e => e.resolved);
}

/**
 * Mark a turn as resolved and return updated turn order.
 */
export function resolveTurn(turnOrder: InitiativeEntry[], index: number): InitiativeEntry[] {
  return turnOrder.map((entry, i) =>
    i === index ? { ...entry, resolved: true } : entry
  );
}
