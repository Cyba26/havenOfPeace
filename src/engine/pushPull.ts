import type { AxialCoord, HexMap } from '@/types/hex';
import { hexDistance, hexNeighbors, hexKey } from './hex';

/**
 * Calculate push destination: each step must increase distance from pusher.
 * Push ignores difficult terrain cost.
 * Triggers hazard effects if pushed into hazard hex.
 */
export function calculatePushDestination(
  targetPos: AxialCoord,
  pusherPos: AxialCoord,
  pushAmount: number,
  map: HexMap,
  occupied: Set<string>,
): { finalPos: AxialCoord; hazardDamage: number } {
  let current = targetPos;
  let totalHazardDamage = 0;

  for (let step = 0; step < pushAmount; step++) {
    const currentDist = hexDistance(current, pusherPos);
    const neighbors = hexNeighbors(current);

    // Find valid neighbor that increases distance from pusher
    let bestNeighbor: AxialCoord | null = null;
    let bestDist = currentDist;

    for (const n of neighbors) {
      const key = hexKey(n);
      const cell = map.cells.get(key);
      if (!cell) continue; // off map
      if (cell.terrain === 'obstacle') continue;
      if (occupied.has(key) && key !== hexKey(targetPos)) continue; // blocked by another figure

      const dist = hexDistance(n, pusherPos);
      if (dist > bestDist) {
        bestNeighbor = n;
        bestDist = dist;
      }
    }

    if (!bestNeighbor) break; // can't push further

    current = bestNeighbor;
    const cell = map.cells.get(hexKey(current));
    if (cell?.terrain === 'hazard' && cell.hazardDamage) {
      totalHazardDamage += cell.hazardDamage;
    }
  }

  return { finalPos: current, hazardDamage: totalHazardDamage };
}

/**
 * Calculate pull destination: each step must decrease distance from puller.
 * Pull ignores difficult terrain cost.
 * Triggers hazard effects if pulled into hazard hex.
 */
export function calculatePullDestination(
  targetPos: AxialCoord,
  pullerPos: AxialCoord,
  pullAmount: number,
  map: HexMap,
  occupied: Set<string>,
): { finalPos: AxialCoord; hazardDamage: number } {
  let current = targetPos;
  let totalHazardDamage = 0;

  for (let step = 0; step < pullAmount; step++) {
    const currentDist = hexDistance(current, pullerPos);
    const neighbors = hexNeighbors(current);

    let bestNeighbor: AxialCoord | null = null;
    let bestDist = currentDist;

    for (const n of neighbors) {
      const key = hexKey(n);
      const cell = map.cells.get(key);
      if (!cell) continue;
      if (cell.terrain === 'obstacle') continue;
      if (occupied.has(key) && key !== hexKey(targetPos)) continue;

      const dist = hexDistance(n, pullerPos);
      if (dist < bestDist) {
        bestNeighbor = n;
        bestDist = dist;
      }
    }

    if (!bestNeighbor) break;

    current = bestNeighbor;
    const cell = map.cells.get(hexKey(current));
    if (cell?.terrain === 'hazard' && cell.hazardDamage) {
      totalHazardDamage += cell.hazardDamage;
    }
  }

  return { finalPos: current, hazardDamage: totalHazardDamage };
}
