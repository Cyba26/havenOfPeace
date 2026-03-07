import type { ScenarioDef, HexDef, MonsterPlacement } from '@/types/scenario';

type Difficulty = 'easy' | 'medium' | 'hard';

/** Simple seeded PRNG (mulberry32) */
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface RoomDef {
  centerQ: number;
  centerR: number;
  radius: number;
}

const DIFFICULTY_CONFIG = {
  easy: {
    rooms: 2,
    roomRadius: [2, 2],
    monsterCount: 2,
    eliteCount: 0,
    obstaclePercent: 8,
    hazardPercent: 5,
    difficultPercent: 10,
  },
  medium: {
    rooms: 2,
    roomRadius: [3, 2],
    monsterCount: 3,
    eliteCount: 1,
    obstaclePercent: 12,
    hazardPercent: 8,
    difficultPercent: 15,
  },
  hard: {
    rooms: 3,
    roomRadius: [3, 2, 2],
    monsterCount: 5,
    eliteCount: 2,
    obstaclePercent: 15,
    hazardPercent: 12,
    difficultPercent: 15,
  },
} as const;

/** Generate hex cells for a room centered at (cq, cr) with given radius */
function generateRoom(cq: number, cr: number, radius: number): { q: number; r: number }[] {
  const coords: { q: number; r: number }[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.abs(s) > radius) continue;
      coords.push({ q: cq + q, r: cr + r });
    }
  }
  return coords;
}

/** Generate a corridor between two room centers */
function generateCorridor(from: { q: number; r: number }, to: { q: number; r: number }): { q: number; r: number }[] {
  const coords: { q: number; r: number }[] = [];
  let { q, r } = from;
  while (q !== to.q || r !== to.r) {
    const dq = to.q - q;
    const dr = to.r - r;
    // Move in the direction with the largest delta
    if (Math.abs(dq) >= Math.abs(dr)) {
      q += dq > 0 ? 1 : -1;
    } else {
      r += dr > 0 ? 1 : -1;
    }
    coords.push({ q, r });
    // Add a neighbor for corridor width
    coords.push({ q: q, r: r - 1 });
    coords.push({ q: q - 1, r: r });
  }
  return coords;
}

/** Place rooms for the dungeon */
function placeRooms(roomCount: number, radii: readonly number[], rand: () => number): RoomDef[] {
  const rooms: RoomDef[] = [{ centerQ: 0, centerR: 0, radius: radii[0] }];

  // Direction offsets for placing subsequent rooms
  const directions = [
    { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 },
    { q: -1, r: 0 }, { q: 0, r: -1 }, { q: 1, r: -1 },
  ];

  for (let i = 1; i < roomCount; i++) {
    const parent = rooms[Math.floor(rand() * rooms.length)];
    const dir = directions[Math.floor(rand() * directions.length)];
    const spacing = parent.radius + radii[i] + 2; // gap between rooms for corridor
    rooms.push({
      centerQ: parent.centerQ + dir.q * spacing,
      centerR: parent.centerR + dir.r * spacing,
      radius: radii[i],
    });
  }

  return rooms;
}

export function generateRandomScenario(difficulty: Difficulty, seed: number): ScenarioDef {
  const rand = mulberry32(seed);
  const config = DIFFICULTY_CONFIG[difficulty];

  // Place rooms
  const rooms = placeRooms(config.rooms, config.roomRadius, rand);

  // Generate all hex positions
  const hexSet = new Set<string>();
  const allCoords: { q: number; r: number }[] = [];

  // Add room hexes
  for (const room of rooms) {
    const roomCoords = generateRoom(room.centerQ, room.centerR, room.radius);
    for (const c of roomCoords) {
      const key = `${c.q},${c.r}`;
      if (!hexSet.has(key)) {
        hexSet.add(key);
        allCoords.push(c);
      }
    }
  }

  // Add corridors between rooms
  for (let i = 1; i < rooms.length; i++) {
    const from = { q: rooms[i - 1].centerQ, r: rooms[i - 1].centerR };
    const to = { q: rooms[i].centerQ, r: rooms[i].centerR };
    const corridor = generateCorridor(from, to);
    for (const c of corridor) {
      const key = `${c.q},${c.r}`;
      if (!hexSet.has(key)) {
        hexSet.add(key);
        allCoords.push(c);
      }
    }
  }

  // Convert to HexDefs with terrain
  const startRoom = rooms[0];
  const hexes: HexDef[] = allCoords.map(c => {
    const isStart = c.q === startRoom.centerQ && c.r === startRoom.centerR;
    if (isStart) return { q: c.q, r: c.r, terrain: 'empty' as const, isStartingHex: true };

    // Distance from room 0 center
    const distFromStart = Math.max(
      Math.abs(c.q - startRoom.centerQ),
      Math.abs(c.r - startRoom.centerR),
      Math.abs((-c.q - c.r) - (-startRoom.centerQ - startRoom.centerR))
    );

    // Don't place terrain near start
    if (distFromStart <= 1) return { q: c.q, r: c.r, terrain: 'empty' as const };

    const roll = rand() * 100;
    if (roll < config.obstaclePercent) return { q: c.q, r: c.r, terrain: 'obstacle' as const };
    if (roll < config.obstaclePercent + config.hazardPercent) {
      return { q: c.q, r: c.r, terrain: 'hazard' as const, hazardDamage: rand() < 0.5 ? 1 : 2 };
    }
    if (roll < config.obstaclePercent + config.hazardPercent + config.difficultPercent) {
      return { q: c.q, r: c.r, terrain: 'difficult' as const };
    }
    return { q: c.q, r: c.r, terrain: 'empty' as const };
  });

  // Place monsters in rooms other than the starting room
  const monsterRooms = rooms.length > 1 ? rooms.slice(1) : [rooms[0]];
  const monsterTypes = ['guard', 'archer'];
  const monsters: MonsterPlacement[] = [];

  // Get empty hexes in monster rooms, far from start
  const monsterCandidates = hexes.filter(h => {
    if (h.terrain !== 'empty' || h.isStartingHex) return false;
    // Must be in a non-start room
    return monsterRooms.some(room => {
      const dist = Math.max(
        Math.abs(h.q - room.centerQ),
        Math.abs(h.r - room.centerR),
        Math.abs((-h.q - h.r) - (-room.centerQ - room.centerR))
      );
      return dist <= room.radius;
    });
  });

  // Shuffle candidates
  for (let i = monsterCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [monsterCandidates[i], monsterCandidates[j]] = [monsterCandidates[j], monsterCandidates[i]];
  }

  const totalMonsters = config.monsterCount;
  for (let i = 0; i < totalMonsters && i < monsterCandidates.length; i++) {
    const hex = monsterCandidates[i];
    monsters.push({
      defId: monsterTypes[Math.floor(rand() * monsterTypes.length)],
      position: { q: hex.q, r: hex.r },
      isElite: i < config.eliteCount,
    });
  }

  const diffLabel = difficulty === 'easy' ? 'Facile' : difficulty === 'medium' ? 'Moyen' : 'Difficile';

  return {
    id: 'scenario-03-random',
    name: `Donjon Al\u00e9atoire (${diffLabel})`,
    description: `Un donjon g\u00e9n\u00e9r\u00e9 al\u00e9atoirement avec ${rooms.length} salles. Difficult\u00e9 : ${diffLabel}.`,
    hexes,
    monsters,
    characterStart: { q: startRoom.centerQ, r: startRoom.centerR },
    objectiveType: 'kill_all',
    requiredMonsters: ['guard', 'archer'],
  };
}
