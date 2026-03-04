import type { AxialCoord, TerrainType } from './hex';

export interface HexDef {
  q: number;
  r: number;
  terrain: TerrainType;
  hazardDamage?: number;
  isStartingHex?: boolean;
}

export interface MonsterPlacement {
  defId: string;           // references MonsterDef.id
  position: AxialCoord;
  isElite: boolean;
}

export interface ScenarioDef {
  id: string;
  name: string;
  description: string;
  hexes: HexDef[];
  monsters: MonsterPlacement[];
  characterStart: AxialCoord;
  objectiveType: 'kill_all';
  /** Monster definition IDs needed for this scenario */
  requiredMonsters: string[];
}
