import type { AxialCoord, HexMap } from '@/types/hex';
import type { MonsterInstance, MonsterDef } from '@/types/monsters';
import type { ConditionType } from '@/types/cards';
import { MODIFIER_MISS, MODIFIER_X2 } from '@/types/monsters';
import { hexDistance, hasLineOfSight, hexKey } from './hex';
import { hasCondition } from './conditions';

export type AttackAdvantage = 'advantage' | 'disadvantage' | 'normal';

// ─── Attack Modifier Resolution ───────────────────────────────────

export interface ModifierResult {
  rawModifier: number;
  isMiss: boolean;
  isDouble: boolean;
  newRow: number;
}

/**
 * Resolve an attack modifier from the modifier table.
 * The table is a flat array of values, cycled through with a row pointer.
 * Values: number = +/- modifier, MODIFIER_MISS = miss, MODIFIER_X2 = x2
 */
export function resolveModifier(
  modifierTable: number[],
  currentRow: number,
): ModifierResult {
  const value = modifierTable[currentRow % modifierTable.length];
  const newRow = (currentRow + 1) % modifierTable.length;

  if (value === MODIFIER_MISS) {
    return { rawModifier: 0, isMiss: true, isDouble: false, newRow };
  }
  if (value === MODIFIER_X2) {
    return { rawModifier: 0, isMiss: false, isDouble: true, newRow };
  }
  return { rawModifier: value, isMiss: false, isDouble: false, newRow };
}

// ─── Advantage / Disadvantage ─────────────────────────────────────

/**
 * Determine advantage/disadvantage for an attack.
 * Sources: strengthen = advantage, muddle = disadvantage,
 * ranged attack on adjacent target = disadvantage.
 * Both cancel out.
 */
export function determineAdvantage(
  attackerConditions: ConditionType[],
  isRangedAttack: boolean,
  isAdjacentTarget: boolean,
): AttackAdvantage {
  let advCount = 0;
  let disadvCount = 0;

  if (hasCondition(attackerConditions, 'strengthen')) advCount++;
  if (hasCondition(attackerConditions, 'muddle')) disadvCount++;
  if (isRangedAttack && isAdjacentTarget) disadvCount++;

  if (advCount > 0 && disadvCount > 0) return 'normal';
  if (advCount > 0) return 'advantage';
  if (disadvCount > 0) return 'disadvantage';
  return 'normal';
}

/** Compare two modifier results: return the "better" one */
function isBetterModifier(a: ModifierResult, b: ModifierResult): boolean {
  // miss is always worst
  if (a.isMiss && !b.isMiss) return false;
  if (!a.isMiss && b.isMiss) return true;
  // x2 is generally best (unless both are x2)
  if (a.isDouble && !b.isDouble) return true;
  if (!a.isDouble && b.isDouble) return false;
  // compare raw values
  return a.rawModifier >= b.rawModifier;
}

// ─── Attack Resolution ────────────────────────────────────────────

export interface AttackResult {
  baseDamage: number;
  modifier: ModifierResult;
  shieldReduction: number;
  finalDamage: number;
  targetId: string;
}

/**
 * Resolve a full attack against a target.
 * Supports advantage (roll twice, take better) and disadvantage (take worse).
 */
export function resolveAttack(
  baseAttackValue: number,
  modifierTable: number[],
  modifierRow: number,
  targetShield: number,
  piercing: number = 0,
  advantage: AttackAdvantage = 'normal',
  poisonBonus: boolean = false,
): { damage: number; modifier: ModifierResult } {
  // Apply poison: +1 to base attack value
  const effectiveBase = poisonBonus ? baseAttackValue + 1 : baseAttackValue;

  let modifier: ModifierResult;

  if (advantage === 'advantage') {
    const mod1 = resolveModifier(modifierTable, modifierRow);
    const mod2 = resolveModifier(modifierTable, mod1.newRow);
    modifier = isBetterModifier(mod1, mod2)
      ? { ...mod1, newRow: mod2.newRow }
      : { ...mod2 };
  } else if (advantage === 'disadvantage') {
    const mod1 = resolveModifier(modifierTable, modifierRow);
    const mod2 = resolveModifier(modifierTable, mod1.newRow);
    modifier = isBetterModifier(mod1, mod2)
      ? { ...mod2 }
      : { ...mod1, newRow: mod2.newRow };
  } else {
    modifier = resolveModifier(modifierTable, modifierRow);
  }

  if (modifier.isMiss) {
    return { damage: 0, modifier };
  }

  let damage: number;
  if (modifier.isDouble) {
    damage = effectiveBase * 2;
  } else {
    damage = effectiveBase + modifier.rawModifier;
  }

  // Apply shield (reduced by piercing)
  const effectiveShield = Math.max(0, targetShield - piercing);
  damage = Math.max(0, damage - effectiveShield);

  return { damage, modifier };
}

// ─── Target Validation ────────────────────────────────────────────

/**
 * Get all valid attack targets from a position.
 * Returns monster instance IDs that are in range and have LOS.
 */
export function getValidAttackTargets(
  attackerPos: AxialCoord,
  range: number,
  map: HexMap,
  monsters: Map<string, MonsterInstance>,
): string[] {
  const targets: string[] = [];

  for (const monster of monsters.values()) {
    if (monster.currentHP <= 0) continue;
    // Invisible monsters cannot be targeted
    if (hasCondition(monster.conditions, 'invisible')) continue;

    const dist = hexDistance(attackerPos, monster.position);
    if (dist > range) continue;

    if (dist > 1 && !hasLineOfSight(attackerPos, monster.position, map)) {
      continue;
    }

    targets.push(monster.instanceId);
  }

  return targets;
}

/**
 * Check if character is adjacent to any monster (for melee attacks).
 * Melee range = 1.
 */
export function getAdjacentMonsters(
  position: AxialCoord,
  monsters: Map<string, MonsterInstance>,
): MonsterInstance[] {
  const adjacent: MonsterInstance[] = [];
  for (const m of monsters.values()) {
    if (m.currentHP <= 0) continue;
    if (hexDistance(position, m.position) === 1) {
      adjacent.push(m);
    }
  }
  return adjacent;
}

/**
 * Apply damage to a monster. Returns updated instance (or null if dead).
 */
export function applyDamageToMonster(
  monster: MonsterInstance,
  damage: number,
): MonsterInstance {
  const newHP = Math.max(0, monster.currentHP - damage);
  return { ...monster, currentHP: newHP };
}

/**
 * Apply damage to character. Returns new HP value.
 */
export function applyDamageToCharacter(
  currentHP: number,
  damage: number,
): number {
  return Math.max(0, currentHP - damage);
}

/**
 * Resolve retaliate damage.
 * Retaliate is NOT an attack: no modifier roll, ignores shield.
 * Only triggers if retaliator is alive and attacker is within range.
 */
export function resolveRetaliate(
  retaliateValue: number,
  retaliateRange: number,
  retaliatorPos: AxialCoord,
  attackerPos: AxialCoord,
): { damage: number; inRange: boolean } {
  const dist = hexDistance(retaliatorPos, attackerPos);
  if (dist > retaliateRange) {
    return { damage: 0, inRange: false };
  }
  return { damage: retaliateValue, inRange: true };
}
