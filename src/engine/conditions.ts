import type { ConditionType } from '@/types/cards';

/** Conditions that expire at end of the figure's next turn */
const END_OF_TURN_CONDITIONS: ConditionType[] = ['immobilize', 'disarm', 'muddle', 'invisible', 'strengthen'];

/** Apply a condition (no duplicates) */
export function applyCondition(conditions: ConditionType[], condition: ConditionType): ConditionType[] {
  if (conditions.includes(condition)) return conditions; // already has it
  return [...conditions, condition];
}

/** Remove a condition */
export function removeCondition(conditions: ConditionType[], condition: ConditionType): ConditionType[] {
  return conditions.filter(c => c !== condition);
}

/** Check if figure has a specific condition */
export function hasCondition(conditions: ConditionType[], condition: ConditionType): boolean {
  return conditions.includes(condition);
}

/**
 * Process start-of-turn effects:
 * - Wound: suffer 1 damage
 */
export function processStartOfTurnConditions(
  conditions: ConditionType[],
  currentHP: number,
): { newHP: number; logs: string[] } {
  const logs: string[] = [];
  let newHP = currentHP;

  if (hasCondition(conditions, 'wound')) {
    newHP = Math.max(0, newHP - 1);
    logs.push('Wound: suffers 1 damage');
  }

  return { newHP, logs };
}

/**
 * Process end-of-turn condition removal:
 * Removes: immobilize, disarm, muddle, invisible, strengthen
 * Does NOT remove wound or poison (those have their own removal rules)
 */
export function processEndOfTurnConditions(
  conditions: ConditionType[],
): { newConditions: ConditionType[]; removed: ConditionType[] } {
  const removed: ConditionType[] = [];
  const newConditions = conditions.filter(c => {
    if (END_OF_TURN_CONDITIONS.includes(c)) {
      removed.push(c);
      return false;
    }
    return true;
  });
  return { newConditions, removed };
}

/**
 * Process heal interaction with conditions:
 * - If poisoned: remove poison, but heal restores 0 HP
 * - If wounded: remove wound, heal amount still applies
 * - Both can be present: remove both, heal amount still blocked by poison
 */
export function processHealWithConditions(
  conditions: ConditionType[],
  healAmount: number,
  currentHP: number,
  maxHP: number,
): { newHP: number; newConditions: ConditionType[]; actualHeal: number; logs: string[] } {
  const logs: string[] = [];
  let newConditions = [...conditions];
  let actualHeal = healAmount;

  // Poison: prevents HP gain, but removed by heal
  const hasPoisonCondition = hasCondition(newConditions, 'poison');
  if (hasPoisonCondition) {
    newConditions = removeCondition(newConditions, 'poison');
    actualHeal = 0;
    logs.push('Poison removed (heal prevented)');
  }

  // Wound: removed by heal (heal amount still applies unless poisoned)
  if (hasCondition(newConditions, 'wound')) {
    newConditions = removeCondition(newConditions, 'wound');
    logs.push('Wound removed');
  }

  const newHP = Math.min(maxHP, currentHP + actualHeal);
  if (actualHeal > 0 && newHP > currentHP) {
    logs.push(`Healed for ${newHP - currentHP}`);
  }

  return { newHP, newConditions, actualHeal, logs };
}
