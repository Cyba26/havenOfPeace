import type { AxialCoord, HexMap } from '@/types/hex';
import type { MonsterInstance } from '@/types/monsters';
import { hexKey, getReachableHexes } from './hex';

/**
 * Build a set of blocked hex keys (enemies, obstacles already handled by terrain).
 * For character movement: monster positions block.
 * For monster movement: character position and other monster positions block.
 */
export function getBlockedHexes(
  monsters: Map<string, MonsterInstance>,
  characterPosition: AxialCoord,
  excludeInstanceId?: string,
): Set<string> {
  const blocked = new Set<string>();
  blocked.add(hexKey(characterPosition));
  for (const m of monsters.values()) {
    if (m.currentHP <= 0) continue;
    if (m.instanceId === excludeInstanceId) continue;
    blocked.add(hexKey(m.position));
  }
  return blocked;
}

/**
 * Get blocked hexes from the character's perspective (only monsters block).
 */
export function getCharacterBlockedHexes(
  monsters: Map<string, MonsterInstance>,
): Set<string> {
  const blocked = new Set<string>();
  for (const m of monsters.values()) {
    if (m.currentHP <= 0) continue;
    blocked.add(hexKey(m.position));
  }
  return blocked;
}

/**
 * Get all hexes the character can move to.
 */
export function getCharacterReachableHexes(
  position: AxialCoord,
  movePoints: number,
  map: HexMap,
  monsters: Map<string, MonsterInstance>,
  isJump = false,
): Map<string, number> {
  const blocked = getCharacterBlockedHexes(monsters);
  return getReachableHexes(position, movePoints, map, blocked, isJump);
}

/**
 * Get all hexes a monster can move to.
 */
export function getMonsterReachableHexes(
  monster: MonsterInstance,
  movePoints: number,
  map: HexMap,
  monsters: Map<string, MonsterInstance>,
  characterPosition: AxialCoord,
  isJump = false,
): Map<string, number> {
  const blocked = getBlockedHexes(monsters, characterPosition, monster.instanceId);
  return getReachableHexes(monster.position, movePoints, map, blocked, isJump);
}
