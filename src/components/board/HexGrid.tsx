'use client';
import React, { useMemo, useEffect, useState } from 'react';
import type { AxialCoord, HexMap } from '@/types/hex';
import type { MonsterInstance, MonsterDef } from '@/types/monsters';
import type { ConditionType } from '@/types/cards';
import type { TerrainType } from '@/types/hex';
import { hexToPixel, hexKey } from '@/engine/hex';
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
    const pad = hexSize * 3.5;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [hexMap, hexSize]);

  // Deterministic decorations around the map edges
  const decorations = useMemo(() => {
    const cells = Array.from(hexMap.cells.values());
    const items: { x: number; y: number; type: 'tree' | 'rock' | 'bush'; seed: number }[] = [];
    // Simple hash for determinism
    const hash = (n: number) => ((n * 2654435761) >>> 0) % 1000;

    cells.forEach((cell, idx) => {
      const px = hexToPixel(cell.coord, hexSize);
      // Place decorations at offsets around each border hex
      const neighbors = [
        { q: cell.coord.q + 1, r: cell.coord.r },
        { q: cell.coord.q - 1, r: cell.coord.r },
        { q: cell.coord.q, r: cell.coord.r + 1 },
        { q: cell.coord.q, r: cell.coord.r - 1 },
        { q: cell.coord.q + 1, r: cell.coord.r - 1 },
        { q: cell.coord.q - 1, r: cell.coord.r + 1 },
      ];
      const isBorder = neighbors.some(n => !hexMap.cells.has(hexKey(n)));
      if (!isBorder) return;

      const h = hash(idx * 7 + 31);
      if (h > 400) return; // Only ~40% of border hexes get decorations

      const angle = (h % 6) * (Math.PI / 3) + Math.PI / 6;
      const dist = hexSize * 1.6 + (h % 30);
      const x = px.x + Math.cos(angle) * dist;
      const y = px.y + Math.sin(angle) * dist;
      const type = h % 3 === 0 ? 'tree' : h % 3 === 1 ? 'rock' : 'bush';
      items.push({ x, y, type, seed: h });
    });
    return items;
  }, [hexMap, hexSize]);

  const aliveMonsters = useMemo(() =>
    Array.from(monsters.values()).filter(m => m.currentHP > 0),
    [monsters]
  );

  return (
    <svg viewBox={viewBox} className="w-full h-full" style={{ maxHeight: '65vh' }}>
      {/* Layer 0: Decorations */}
      {decorations.map((d, i) => (
        <g key={`deco-${i}`} transform={`translate(${d.x}, ${d.y})`} opacity={0.25}>
          {d.type === 'tree' && (
            <>
              <rect x={-1.5} y={2} width={3} height={8} fill="#3a2a1a" />
              <polygon points={`0,${-8 - (d.seed % 5)} ${-6 - (d.seed % 3)},4 ${6 + (d.seed % 3)},4`} fill="#1a3a1a" />
              <polygon points={`0,${-12 - (d.seed % 4)} ${-4 - (d.seed % 2)},0 ${4 + (d.seed % 2)},0`} fill="#1a4a1a" />
            </>
          )}
          {d.type === 'rock' && (
            <path d={`M${-4 - d.seed % 3},3 L${-6 - d.seed % 2},0 L${-3},-4 L${2},-5 L${5 + d.seed % 3},-2 L${6},3 Z`} fill="#2a2a30" stroke="#3a3a40" strokeWidth={0.5} />
          )}
          {d.type === 'bush' && (
            <>
              <ellipse cx={-3} cy={0} rx={4 + d.seed % 2} ry={3} fill="#1a2a1a" />
              <ellipse cx={3} cy={1} rx={3 + d.seed % 2} ry={2.5} fill="#1a3518" />
            </>
          )}
        </g>
      ))}

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
