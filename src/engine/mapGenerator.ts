import type { HexCell, TerrainType } from '@/types/hex';

export interface MapGenParams {
  radius: number;       // number of hex rings (2-5)
  obstaclePercent: number;  // 0-30
  hazardPercent: number;    // 0-20
  difficultPercent: number; // 0-30
  seed: number;
}

/** Simple seeded pseudo-random number generator (mulberry32) */
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate a hex map with the given parameters */
export function generateHexMap(params: MapGenParams): HexCell[] {
  const { radius, obstaclePercent, hazardPercent, difficultPercent, seed } = params;
  const rand = mulberry32(seed);
  const cells: HexCell[] = [];

  // Generate hex ring coordinates (axial)
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.abs(s) > radius) continue;

      // Determine terrain
      let terrain: TerrainType = 'empty';
      const roll = rand() * 100;

      // Center hex is always the starting hex
      if (q === 0 && r === 0) {
        cells.push({ coord: { q, r }, terrain: 'empty', isStartingHex: true });
        continue;
      }

      // Don't place obstacles/hazards on the inner ring (adjacent to start)
      const dist = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      if (dist <= 1) {
        cells.push({ coord: { q, r }, terrain: 'empty' });
        continue;
      }

      if (roll < obstaclePercent) {
        terrain = 'obstacle';
      } else if (roll < obstaclePercent + hazardPercent) {
        terrain = 'hazard';
      } else if (roll < obstaclePercent + hazardPercent + difficultPercent) {
        terrain = 'difficult';
      }

      const cell: HexCell = { coord: { q, r }, terrain };
      if (terrain === 'hazard') {
        cell.hazardDamage = rand() < 0.5 ? 1 : 2;
      }
      cells.push(cell);
    }
  }

  return cells;
}

/** Generate monster spawn positions (outer ring hexes that are empty) */
export function getMonsterSpawns(cells: HexCell[], count: number, seed: number): { q: number; r: number }[] {
  const rand = mulberry32(seed + 999);
  const emptyCells = cells.filter(c =>
    c.terrain === 'empty' && !c.isStartingHex &&
    Math.max(Math.abs(c.coord.q), Math.abs(c.coord.r), Math.abs(-c.coord.q - c.coord.r)) >= 2
  );

  // Shuffle using Fisher-Yates
  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
  }

  return emptyCells.slice(0, count).map(c => c.coord);
}
