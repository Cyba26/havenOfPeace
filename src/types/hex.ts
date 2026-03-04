/** Axial hex coordinates (q = column, r = row) */
export interface AxialCoord {
  q: number;
  r: number;
}

/** Cube coordinates for hex math (q + r + s = 0) */
export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

/** Pixel position for SVG rendering */
export interface PixelCoord {
  x: number;
  y: number;
}

export type TerrainType =
  | 'empty'           // normal walkable hex
  | 'obstacle'        // blocks movement and LOS for figures, not for range
  | 'difficult'       // costs 2 movement points
  | 'hazard'          // damage/effect when entered
  | 'pressure_plate'  // triggers scenario effects
  | 'objective';      // can be attacked, occupies hex

export interface HexCell {
  coord: AxialCoord;
  terrain: TerrainType;
  hazardDamage?: number;     // damage dealt when entering hazard
  isStartingHex?: boolean;   // character can start here
}

export interface HexMap {
  cells: Map<string, HexCell>; // key = "q,r"
}
