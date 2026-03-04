'use client';
import React from 'react';
import type { AxialCoord, TerrainType } from '@/types/hex';
import { hexToPixel, hexPolygonPoints } from '@/engine/hex';

const TERRAIN_COLORS: Record<TerrainType, string> = {
  empty: 'var(--color-hex-empty)',
  obstacle: 'var(--color-hex-obstacle)',
  difficult: 'var(--color-hex-difficult)',
  hazard: 'var(--color-hex-hazard)',
  pressure_plate: '#1a2a1a',
  objective: '#2a1a2a',
};

const TERRAIN_STROKE: Record<TerrainType, string> = {
  empty: 'var(--color-hex-empty-stroke)',
  obstacle: '#1a1a22',
  difficult: '#3a3a2a',
  hazard: '#5a2a2a',
  pressure_plate: '#2a4a2a',
  objective: '#4a2a4a',
};

interface HexTileProps {
  coord: AxialCoord;
  terrain: TerrainType;
  hexSize: number;
  isReachable: boolean;
  onClick?: (coord: AxialCoord) => void;
}

export function HexTile({ coord, terrain, hexSize, isReachable, onClick }: HexTileProps) {
  const pixel = hexToPixel(coord, hexSize);
  const points = hexPolygonPoints(pixel, hexSize * 0.95);

  const fill = isReachable ? 'var(--color-hex-reachable)' : TERRAIN_COLORS[terrain];
  const stroke = isReachable ? 'var(--color-hex-reachable-stroke)' : TERRAIN_STROKE[terrain];

  return (
    <g
      className={`hex-tile ${isReachable ? 'hex-reachable' : ''}`}
      onClick={() => onClick?.(coord)}
    >
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={isReachable ? 2 : 1}
      />
      {/* Terrain icon indicators */}
      {terrain === 'obstacle' && (
        <text x={pixel.x} y={pixel.y + 4} textAnchor="middle" fontSize={14} fill="#3a3a4a">
          X
        </text>
      )}
      {terrain === 'hazard' && (
        <text x={pixel.x} y={pixel.y + 4} textAnchor="middle" fontSize={12} fill="#8a3a3a">
          !
        </text>
      )}
      {terrain === 'difficult' && (
        <text x={pixel.x} y={pixel.y + 4} textAnchor="middle" fontSize={10} fill="#5a5a3a">
          ~
        </text>
      )}
    </g>
  );
}
