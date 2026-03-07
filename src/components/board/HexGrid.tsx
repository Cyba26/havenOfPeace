'use client';
import React, { useMemo, useEffect, useState } from 'react';
import type { AxialCoord, HexMap } from '@/types/hex';
import type { MonsterInstance, MonsterDef } from '@/types/monsters';
import type { ConditionType } from '@/types/cards';
import type { TerrainType } from '@/types/hex';
import { hexToPixel, hexKey, hexPolygonPoints } from '@/engine/hex';
import { HexTile } from './HexTile';
import { Figure } from './Figure';
import { t } from '@/i18n';

function terrainTooltip(terrain: TerrainType, hazardDamage?: number): string | undefined {
  switch (terrain) {
    case 'obstacle': return t('terrain.obstacle');
    case 'hazard': return t('terrain.hazard', { damage: hazardDamage ?? 1 });
    case 'difficult': return t('terrain.difficult');
    case 'pressure_plate': return t('terrain.pressure_plate');
    case 'objective': return t('terrain.objective');
    default: return undefined;
  }
}

interface HexGridProps {
  hexMap: HexMap;
  hexSize: number;
  characterPosition: AxialCoord;
  characterHP: number;
  characterMaxHP: number;
  characterConditions?: ConditionType[];
  monsters: Map<string, MonsterInstance>;
  monsterDefs?: Record<string, MonsterDef>;
  reachableHexes: Set<string> | null;
  validAttackTargets: string[] | null;
  onHexClick?: (coord: AxialCoord) => void;
  onMonsterClick?: (instanceId: string) => void;
  attackAnimation?: { from: AxialCoord; to: AxialCoord } | null;
}

export function HexGrid({
  hexMap, hexSize, characterPosition, characterHP, characterMaxHP,
  characterConditions, monsters, monsterDefs, reachableHexes, validAttackTargets,
  onHexClick, onMonsterClick, attackAnimation,
}: HexGridProps) {
  const [showAttackLine, setShowAttackLine] = useState(false);

  useEffect(() => {
    if (attackAnimation) {
      setShowAttackLine(true);
      const timer = setTimeout(() => setShowAttackLine(false), 500);
      return () => clearTimeout(timer);
    }
  }, [attackAnimation]);

  // Compute wall hexes (outer ring around the map)
  const wallCoords = useMemo(() => {
    const HEX_DIRS = [
      { q: 1, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 1 },
      { q: 0, r: -1 }, { q: 1, r: -1 }, { q: -1, r: 1 },
    ];
    const walls = new Set<string>();
    for (const cell of hexMap.cells.values()) {
      for (const d of HEX_DIRS) {
        const n = { q: cell.coord.q + d.q, r: cell.coord.r + d.r };
        if (!hexMap.cells.has(hexKey(n))) {
          walls.add(hexKey(n));
        }
      }
    }
    return Array.from(walls).map(k => {
      const [q, r] = k.split(',').map(Number);
      return { q, r };
    });
  }, [hexMap]);

  const viewBox = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    // Include both map cells and wall hexes in bounds
    const allCoords = [
      ...Array.from(hexMap.cells.values()).map(c => c.coord),
      ...wallCoords,
    ];
    for (const coord of allCoords) {
      const pixel = hexToPixel(coord, hexSize);
      minX = Math.min(minX, pixel.x);
      maxX = Math.max(maxX, pixel.x);
      minY = Math.min(minY, pixel.y);
      maxY = Math.max(maxY, pixel.y);
    }
    const pad = hexSize * 1.5;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [hexMap, hexSize, wallCoords]);

  const aliveMonsters = useMemo(() =>
    Array.from(monsters.values()).filter(m => m.currentHP > 0),
    [monsters]
  );

  return (
    <svg viewBox={viewBox} className="w-full h-full" style={{ maxHeight: '65vh' }}>
      {/* Layer 0: Wall hexes (border) */}
      {wallCoords.map(coord => {
        const pixel = hexToPixel(coord, hexSize);
        const points = hexPolygonPoints(pixel, hexSize * 0.95);
        return (
          <polygon
            key={`wall-${coord.q},${coord.r}`}
            points={points}
            fill="#1a1a22"
            stroke="#252530"
            strokeWidth={1}
          />
        );
      })}

      {/* Layer 1: Hex tiles */}
      {Array.from(hexMap.cells.values()).map(cell => {
        const key = hexKey(cell.coord);
        const isReachable = reachableHexes?.has(key) ?? false;
        return (
          <HexTile
            key={key}
            coord={cell.coord}
            terrain={cell.terrain}
            hexSize={hexSize}
            isReachable={isReachable}
            onClick={isReachable ? onHexClick : undefined}
            tooltip={terrainTooltip(cell.terrain, cell.hazardDamage)}
          />
        );
      })}

      {/* Layer 2: Monster figures */}
      {aliveMonsters.map(m => {
        const isTarget = validAttackTargets?.includes(m.instanceId) ?? false;
        const mDef = monsterDefs?.[m.defId];
        const stats = mDef ? {
          attack: mDef.baseAttack,
          move: mDef.baseMove,
          shield: mDef.shield,
        } : undefined;
        return (
          <Figure
            key={m.instanceId}
            coord={m.position}
            hexSize={hexSize}
            type={m.isElite ? 'monster-elite' : 'monster-normal'}
            label={m.defId}
            hp={m.currentHP}
            maxHp={m.maxHP}
            conditions={m.conditions}
            isTargetable={isTarget}
            onClick={isTarget ? () => onMonsterClick?.(m.instanceId) : undefined}
            stats={stats}
          />
        );
      })}

      {/* Layer 3: Character figure (always on top) */}
      <Figure
        coord={characterPosition}
        hexSize={hexSize}
        type="character"
        label="Player"
        hp={characterHP}
        maxHp={characterMaxHP}
        conditions={characterConditions}
      />

      {/* Layer 4: Attack animation line */}
      {showAttackLine && attackAnimation && (() => {
        const fromPx = hexToPixel(attackAnimation.from, hexSize);
        const toPx = hexToPixel(attackAnimation.to, hexSize);
        return (
          <line
            x1={fromPx.x} y1={fromPx.y}
            x2={toPx.x} y2={toPx.y}
            stroke="var(--color-blood-red-bright)"
            strokeWidth={3}
            strokeDasharray="8 4"
            className="attack-line"
          />
        );
      })()}
    </svg>
  );
}
