import type { AxialCoord, HexMap } from '@/types/hex';
import type { MonsterInstance, MonsterDef, MonsterAction } from '@/types/monsters';
import type { AbilityAction } from '@/types/cards';
import { hexDistance, hexKey, hexNeighbors, findPath, getReachableHexes } from './hex';
import { getBlockedHexes } from './movement';
import { resolveAttack } from './combat';

// ─── Action Rolling ───────────────────────────────────────────────

/** Roll a random action column (0, 1, or 2) for a monster type */
export function rollMonsterAction(def: MonsterDef): { actionIndex: number; action: MonsterAction } {
  const actionIndex = Math.floor(Math.random() * 3);
  return { actionIndex, action: def.actions[actionIndex] };
}

// ─── Focus Finding ────────────────────────────────────────────────

export interface MonsterMoveResult {
  newPosition: AxialCoord;
  moved: boolean;
}

/**
 * Find the best hex for a monster to move to in order to attack the character.
 * For melee: find the closest hex adjacent to character that the monster can reach.
 * For ranged: find the closest hex within attack range (but not adjacent, to avoid disadvantage).
 *
 * Priority: fewest hazards > fewest movement points
 */
export function findAttackHex(
  monster: MonsterInstance,
  monsterDef: MonsterDef,
  characterPos: AxialCoord,
  map: HexMap,
  monsters: Map<string, MonsterInstance>,
  movePoints: number,
  attackRange: number,
): AxialCoord | null {
  const blocked = getBlockedHexes(monsters, characterPos, monster.instanceId);

  // Get all reachable hexes
  const reachable = getReachableHexes(monster.position, movePoints, map, blocked);
  // Also include current position
  reachable.set(hexKey(monster.position), 0);

  let bestHex: AxialCoord | null = null;
  let bestDist = Infinity;
  let bestCost = Infinity;
  let bestHazards = Infinity;

  for (const [key, cost] of reachable) {
    const [q, r] = key.split(',').map(Number);
    const hex: AxialCoord = { q, r };
    const distToChar = hexDistance(hex, characterPos);

    // Check if this hex is a valid attack position
    let isValidAttack = false;
    if (monsterDef.isRanged) {
      // Ranged: prefer not adjacent (disadvantage), but within range
      isValidAttack = distToChar <= attackRange && distToChar > 0;
    } else {
      // Melee: must be adjacent (distance 1)
      isValidAttack = distToChar === 1;
    }

    if (!isValidAttack) continue;

    // Count hazards on path (simplified: use cost as proxy for now)
    const pathResult = findPath(monster.position, hex, map, blocked);
    const hazards = pathResult?.hazardCount ?? 0;

    // Priority: valid attack > fewer hazards > less movement > closer to character
    if (hazards < bestHazards ||
        (hazards === bestHazards && cost < bestCost) ||
        (hazards === bestHazards && cost === bestCost && distToChar < bestDist)) {
      bestHex = hex;
      bestDist = distToChar;
      bestCost = cost;
      bestHazards = hazards;
    }
  }

  // If no attack hex found, just move as close as possible to character
  if (!bestHex) {
    for (const [key, cost] of reachable) {
      const [q, r] = key.split(',').map(Number);
      const hex: AxialCoord = { q, r };
      const distToChar = hexDistance(hex, characterPos);

      if (distToChar < bestDist || (distToChar === bestDist && cost < bestCost)) {
        bestHex = hex;
        bestDist = distToChar;
        bestCost = cost;
      }
    }
  }

  return bestHex;
}

// ─── Monster Turn Resolution ──────────────────────────────────────

export interface MonsterTurnResult {
  monster: MonsterInstance;
  moved: boolean;
  newPosition: AxialCoord;
  attacked: boolean;
  attackDamage: number;
  logEntries: string[];
  /** If monster healed an ally, this is the target and amount */
  healTarget?: { instanceId: string; amount: number };
}

/**
 * Execute a single monster's turn based on its rolled action.
 */
export function resolveMonsterTurn(
  monster: MonsterInstance,
  monsterDef: MonsterDef,
  action: MonsterAction,
  characterPos: AxialCoord,
  characterShield: number,
  map: HexMap,
  monsters: Map<string, MonsterInstance>,
): MonsterTurnResult {
  const logs: string[] = [];
  let currentPos = monster.position;
  let attacked = false;
  let attackDamage = 0;
  let moved = false;
  let updatedMonster = { ...monster };
  let healTarget: { instanceId: string; amount: number } | undefined;

  // Process abilities in order
  for (const ability of action.abilities) {
    switch (ability.type) {
      case 'move': {
        const movePoints = ability.value ?? monsterDef.baseMove;
        const attackRange = getActionAttackRange(action, monsterDef);

        const targetHex = findAttackHex(
          { ...updatedMonster, position: currentPos },
          monsterDef,
          characterPos,
          map,
          monsters,
          movePoints,
          attackRange,
        );

        if (targetHex && hexKey(targetHex) !== hexKey(currentPos)) {
          logs.push(`${monsterDef.name} ${monster.instanceId} moves`);
          currentPos = targetHex;
          moved = true;
        }
        break;
      }

      case 'attack': {
        const baseAttack = ability.value ?? monsterDef.baseAttack;
        const range = ability.range ?? (monsterDef.isRanged ? 3 : 1);
        const dist = hexDistance(currentPos, characterPos);

        if (dist <= range) {
          const result = resolveAttack(
            baseAttack,
            monsterDef.modifierTable,
            updatedMonster.modifierRow,
            characterShield,
            ability.piercing ?? 0,
          );

          updatedMonster.modifierRow = result.modifier.newRow;
          attackDamage = result.damage;
          attacked = true;

          if (result.modifier.isMiss) {
            logs.push(`${monsterDef.name} ${monster.instanceId} attacks — MISS!`);
          } else if (result.modifier.isDouble) {
            logs.push(`${monsterDef.name} ${monster.instanceId} attacks — x2! ${result.damage} damage`);
          } else {
            logs.push(`${monsterDef.name} ${monster.instanceId} attacks for ${result.damage} damage`);
          }
        } else {
          logs.push(`${monsterDef.name} ${monster.instanceId} can't reach to attack`);
        }
        break;
      }

      case 'heal': {
        const healAmount = ability.value ?? 0;
        const healRange = ability.range ?? 1;

        // Find ally monster with greatest HP deficit within range
        let bestTarget: MonsterInstance | null = null;
        let bestDeficit = 0;
        for (const ally of monsters.values()) {
          if (ally.currentHP <= 0) continue;
          const dist = hexDistance(currentPos, ally.position);
          if (dist > healRange) continue;
          const deficit = ally.maxHP - ally.currentHP;
          if (deficit > bestDeficit) {
            bestDeficit = deficit;
            bestTarget = ally;
          }
        }

        // Also consider self
        const selfDeficit = updatedMonster.maxHP - updatedMonster.currentHP;
        if (selfDeficit > bestDeficit) {
          bestTarget = updatedMonster;
          bestDeficit = selfDeficit;
        }

        if (bestTarget && bestDeficit > 0) {
          if (bestTarget.instanceId === updatedMonster.instanceId) {
            // Self-heal
            const newHP = Math.min(updatedMonster.maxHP, updatedMonster.currentHP + healAmount);
            logs.push(`${monsterDef.name} ${monster.instanceId} heals self for ${newHP - updatedMonster.currentHP}`);
            updatedMonster = { ...updatedMonster, currentHP: newHP };
          } else {
            // Heal ally — store will apply it
            const amount = Math.min(healAmount, bestDeficit);
            healTarget = { instanceId: bestTarget.instanceId, amount };
            logs.push(`${monsterDef.name} ${monster.instanceId} heals ${bestTarget.instanceId} for ${amount}`);
          }
        }
        break;
      }

      case 'shield': {
        logs.push(`${monsterDef.name} ${monster.instanceId} gains Shield ${ability.value}`);
        break;
      }

      default:
        break;
    }
  }

  return {
    monster: { ...updatedMonster, position: currentPos },
    moved,
    newPosition: currentPos,
    attacked,
    attackDamage,
    logEntries: logs,
    healTarget,
  };
}

/** Get the attack range from a monster's action (looks for attack ability) */
function getActionAttackRange(action: MonsterAction, def: MonsterDef): number {
  for (const ability of action.abilities) {
    if (ability.type === 'attack') {
      return ability.range ?? (def.isRanged ? 3 : 1);
    }
  }
  return def.isRanged ? 3 : 1;
}
