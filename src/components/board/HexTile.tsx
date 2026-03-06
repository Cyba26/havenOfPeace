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
      {/* Terrain SVG indicators */}
      {terrain === 'obstacle' && (
        <g transform={`translate(${pixel.x}, ${pixel.y})`}>
          <path d="M-8,6 L-5,-2 L-1,-6 L3,-3 L8,6 Z" fill="#2a2a35" stroke="#3a3a4a" strokeWidth={0.8} />
          <path d="M-3,6 L0,0 L3,-4 L7,-1 L9,6 Z" fill="#1e1e28" stroke="#2a2a3a" strokeWidth={0.8} />
        </g>
      )}
      {terrain === 'hazard' && (
        <g transform={`translate(${pixel.x}, ${pixel.y})`}>
          <path d="M0,-8 C-3,-3 -6,0 -5,5 C-4,7 -1,7 0,6 C1,7 4,7 5,5 C6,0 3,-3 0,-8 Z" fill="#8a2a1a" opacity={0.6} />
          <path d="M0,-4 C-2,-1 -3,1 -3,4 C-2,5 0,5 0,4 C1,5 2,5 3,4 C3,1 2,-1 0,-4 Z" fill="#c44a2a" opacity={0.5} />
        </g>
      )}
      {terrain === 'difficult' && (
        <g transform={`translate(${pixel.x}, ${pixel.y})`}>
          <path d="M-10,-1 Q-5,-4 0,-1 Q5,2 10,-1" fill="none" stroke="#5a5a3a" strokeWidth={1.2} />
          <path d="M-8,4 Q-3,1 2,4 Q7,7 12,4" fill="none" stroke="#4a4a2a" strokeWidth={0.8} />
        </g>
      )}
      {terrain === 'pressure_plate' && (
        <g transform={`translate(${pixel.x}, ${pixel.y})`}>
          <rect x={-7} y={-3} width={14} height={6} rx={1.5} fill="#2a4a2a" stroke="#3a6a3a" strokeWidth={0.8} />
          <circle cx={0} cy={0} r={2} fill="#4a8a4a" opacity={0.7} />
        </g>
      )}
      {terrain === 'objective' && (
        <g transform={`translate(${pixel.x}, ${pixel.y})`}>
          <polygon points="0,-8 2,-3 7,-3 3,1 5,7 0,3 -5,7 -3,1 -7,-3 -2,-3" fill="#6a3a8a" opacity={0.5} stroke="#8a4aaa" strokeWidth={0.5} />
        </g>
      )}
    </g>
  );
}
