import type { AxialCoord, CubeCoord, PixelCoord, HexMap } from '@/types/hex';

// ─── Coordinate helpers ────────────────────────────────────────────

export function hexKey(c: AxialCoord): string {
  return `${c.q},${c.r}`;
}

export function parseHexKey(key: string): AxialCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function axialToCube(a: AxialCoord): CubeCoord {
  return { q: a.q, r: a.r, s: -a.q - a.r };
}

export function cubeToAxial(c: CubeCoord): AxialCoord {
  return { q: c.q, r: c.r };
}

export function cubeRound(fq: number, fr: number, fs: number): CubeCoord {
  let q = Math.round(fq);
  let r = Math.round(fr);
  let s = Math.round(fs);
  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) {
    q = -r - s;
  } else if (dr > ds) {
    r = -q - s;
  } else {
    s = -q - r;
  }
  return { q, r, s };
}

export function coordsEqual(a: AxialCoord, b: AxialCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

// ─── Distance ─────────────────────────────────────────────────────

export function hexDistance(a: AxialCoord, b: AxialCoord): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return Math.max(Math.abs(ac.q - bc.q), Math.abs(ac.r - bc.r), Math.abs(ac.s - bc.s));
}

// ─── Neighbors ────────────────────────────────────────────────────

/** Flat-top hex direction offsets (axial) */
const DIRECTIONS: AxialCoord[] = [
  { q: 1, r: 0 },   // E
  { q: 1, r: -1 },  // NE
  { q: 0, r: -1 },  // NW
  { q: -1, r: 0 },  // W
  { q: -1, r: 1 },  // SW
  { q: 0, r: 1 },   // SE
];

export function hexNeighbors(c: AxialCoord): AxialCoord[] {
  return DIRECTIONS.map(d => ({ q: c.q + d.q, r: c.r + d.r }));
}

// ─── Pixel conversion (flat-top hexagons) ─────────────────────────

export function hexToPixel(c: AxialCoord, size: number): PixelCoord {
  const x = size * (3 / 2 * c.q);
  const y = size * (Math.sqrt(3) / 2 * c.q + Math.sqrt(3) * c.r);
  return { x, y };
}

export function pixelToHex(p: PixelCoord, size: number): AxialCoord {
  const q = (2 / 3 * p.x) / size;
  const r = (-1 / 3 * p.x + Math.sqrt(3) / 3 * p.y) / size;
  const cube = cubeRound(q, r, -q - r);
  return cubeToAxial(cube);
}

// ─── Hex polygon points (for SVG) ─────────────────────────────────

export function hexPolygonPoints(center: PixelCoord, size: number): string {
  const corners: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push(
      `${center.x + size * Math.cos(angleRad)},${center.y + size * Math.sin(angleRad)}`
    );
  }
  return corners.join(' ');
}

// ─── Line drawing (for LOS) ──────────────────────────────────────

export function hexLineDraw(a: AxialCoord, b: AxialCoord): AxialCoord[] {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  const n = hexDistance(a, b);
  if (n === 0) return [a];

  const results: AxialCoord[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const fq = ac.q + (bc.q - ac.q) * t;
    const fr = ac.r + (bc.r - ac.r) * t;
    const fs = ac.s + (bc.s - ac.s) * t;
    const cube = cubeRound(fq + 1e-6, fr + 1e-6, fs - 2e-6);
    results.push(cubeToAxial(cube));
  }
  return results;
}

/** Check line of sight: no obstacle hex between a and b (exclusive) */
export function hasLineOfSight(a: AxialCoord, b: AxialCoord, map: HexMap): boolean {
  const line = hexLineDraw(a, b);
  for (let i = 1; i < line.length - 1; i++) {
    const cell = map.cells.get(hexKey(line[i]));
    if (cell && cell.terrain === 'obstacle') {
      return false;
    }
  }
  return true;
}

// ─── Pathfinding (A*) ─────────────────────────────────────────────

interface PathNode {
  coord: AxialCoord;
  g: number;
  h: number;
  f: number;
  parent: string | null;
  hazardCount: number;
}

export interface PathResult {
  path: AxialCoord[];
  cost: number;
  hazardCount: number;
}

/**
 * Find shortest path from start to goal.
 * @param blockedHexes - hex keys blocked by enemies/objectives
 * @param isJump - jump movement ignores obstacles/enemies along the way
 */
export function findPath(
  start: AxialCoord,
  goal: AxialCoord,
  map: HexMap,
  blockedHexes: Set<string>,
  isJump = false,
): PathResult | null {
  const startKey = hexKey(start);
  const goalKey = hexKey(goal);

  if (!map.cells.has(goalKey)) return null;
  if (blockedHexes.has(goalKey)) return null;

  const nodes = new Map<string, PathNode>();
  const open = new Set<string>();
  const closed = new Set<string>();

  const startNode: PathNode = {
    coord: start,
    g: 0,
    h: hexDistance(start, goal),
    f: hexDistance(start, goal),
    parent: null,
    hazardCount: 0,
  };
  nodes.set(startKey, startNode);
  open.add(startKey);

  while (open.size > 0) {
    // Find best node in open set
    let bestKey = '';
    let bestF = Infinity;
    let bestHazards = Infinity;
    for (const key of open) {
      const node = nodes.get(key)!;
      if (node.f < bestF || (node.f === bestF && node.hazardCount < bestHazards)) {
        bestKey = key;
        bestF = node.f;
        bestHazards = node.hazardCount;
      }
    }

    const bestNode = nodes.get(bestKey)!;

    if (bestKey === goalKey) {
      // Reconstruct path
      const path: AxialCoord[] = [];
      let current: string | null = bestKey;
      while (current) {
        path.unshift(parseHexKey(current));
        current = nodes.get(current)?.parent ?? null;
      }
      return { path, cost: bestNode.g, hazardCount: bestNode.hazardCount };
    }

    open.delete(bestKey);
    closed.add(bestKey);

    for (const neighbor of hexNeighbors(bestNode.coord)) {
      const nKey = hexKey(neighbor);
      if (closed.has(nKey)) continue;

      const cell = map.cells.get(nKey);
      if (!cell) continue;

      if (!isJump) {
        if (cell.terrain === 'obstacle') continue;
        if (blockedHexes.has(nKey)) continue;
      } else {
        // Jump: only block the final destination if occupied
        if (nKey === goalKey && blockedHexes.has(nKey)) continue;
      }

      const moveCost = cell.terrain === 'difficult' && !isJump ? 2 : 1;
      const g = bestNode.g + moveCost;
      const hazards = bestNode.hazardCount +
        (cell.terrain === 'hazard' && !isJump ? 1 : 0);

      const existing = nodes.get(nKey);
      if (existing && existing.g <= g) continue;

      nodes.set(nKey, {
        coord: neighbor,
        g,
        h: hexDistance(neighbor, goal),
        f: g + hexDistance(neighbor, goal),
        parent: bestKey,
        hazardCount: hazards,
      });
      open.add(nKey);
    }
  }

  return null;
}

// ─── Reachable hexes (flood fill) ─────────────────────────────────

/**
 * Get all hexes reachable within `movePoints` from `start`.
 * Returns a map of hexKey -> movement cost.
 */
export function getReachableHexes(
  start: AxialCoord,
  movePoints: number,
  map: HexMap,
  blockedHexes: Set<string>,
  isJump = false,
): Map<string, number> {
  const costs = new Map<string, number>();
  const startKey = hexKey(start);
  costs.set(startKey, 0);

  const queue: { coord: AxialCoord; cost: number }[] = [{ coord: start, cost: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const neighbor of hexNeighbors(current.coord)) {
      const nKey = hexKey(neighbor);
      const cell = map.cells.get(nKey);
      if (!cell) continue;

      if (!isJump) {
        if (cell.terrain === 'obstacle') continue;
        if (blockedHexes.has(nKey)) continue;
      }

      const moveCost = cell.terrain === 'difficult' && !isJump ? 2 : 1;
      const totalCost = current.cost + moveCost;
      if (totalCost > movePoints) continue;

      const existing = costs.get(nKey);
      if (existing !== undefined && existing <= totalCost) continue;

      costs.set(nKey, totalCost);

      if (!blockedHexes.has(nKey)) {
        queue.push({ coord: neighbor, cost: totalCost });
      }
    }
  }

  // Remove start (can't stay) and blocked hexes (can't end there)
  costs.delete(startKey);
  for (const key of blockedHexes) {
    costs.delete(key);
  }

  return costs;
}
