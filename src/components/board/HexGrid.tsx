'use client';
import React, { useMemo } from 'react';
import type { AxialCoord, HexMap } from '@/types/hex';
import type { MonsterInstance } from '@/types/monsters';
import type { ConditionType } from '@/types/cards';
import { hexToPixel, hexKey } from '@/engine/hex';
import { HexTile } from './HexTile';
import { Figure } from './Figure';

interface HexGridProps {
  hexMap: HexMap;
  hexSize: number;
  characterPosition: AxialCoord;
  characterHP: number;
  characterMaxHP: number;
  characterConditions?: ConditionType[];
  monsters: Map<string, MonsterInstance>;
  reachableHexes: Set<string> | null;
  validAttackTargets: string[] | null;
  onHexClick?: (coord: AxialCoord) => void;
  onMonsterClick?: (instanceId: string) => void;
}

export function HexGrid({
  hexMap, hexSize, characterPosition, characterHP, characterMaxHP,
  characterConditions, monsters, reachableHexes, validAttackTargets,
  onHexClick, onMonsterClick,
}: HexGridProps) {
  const viewBox = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const cell of hexMap.cells.values()) {
      const pixel = hexToPixel(cell.coord, hexSize);
      minX = Math.min(minX, pixel.x);
      maxX = Math.max(maxX, pixel.x);
      minY = Math.min(minY, pixel.y);
      maxY = Math.max(maxY, pixel.y);
    }
    const pad = hexSize * 2;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [hexMap, hexSize]);

  const aliveMonsters = useMemo(() =>
    Array.from(monsters.values()).filter(m => m.currentHP > 0),
    [monsters]
  );

  return (
    <svg viewBox={viewBox} className="w-full h-full" style={{ maxHeight: '65vh' }}>
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
          />
        );
      })}

      {/* Layer 2: Monster figures */}
      {aliveMonsters.map(m => {
        const isTarget = validAttackTargets?.includes(m.instanceId) ?? false;
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
    </svg>
  );
}
