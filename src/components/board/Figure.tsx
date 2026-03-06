'use client';
import React from 'react';
import type { AxialCoord } from '@/types/hex';
import type { ConditionType } from '@/types/cards';
import { hexToPixel } from '@/engine/hex';

type FigureType = 'character' | 'monster-normal' | 'monster-elite';

const FIGURE_COLORS: Record<FigureType, string> = {
  character: 'var(--color-character)',
  'monster-normal': 'var(--color-monster-normal)',
  'monster-elite': 'var(--color-monster-elite)',
};

const CONDITION_COLORS: Record<ConditionType, string> = {
  wound: '#c42a2a',
  poison: '#2a8a2a',
  immobilize: '#5a5aaa',
  disarm: '#8a6a3a',
  muddle: '#7a5a8a',
  invisible: '#aaaaaa',
  strengthen: '#d4a020',
};

const CONDITION_LABELS: Record<ConditionType, string> = {
  wound: 'W',
  poison: 'P',
  immobilize: 'I',
  disarm: 'D',
  muddle: 'M',
  invisible: 'V',
  strengthen: 'S',
};

interface FigureProps {
  coord: AxialCoord;
  hexSize: number;
  type: FigureType;
  label: string;
  hp: number;
  maxHp: number;
  conditions?: ConditionType[];
  isTargetable?: boolean;
  onClick?: () => void;
  /** Monster stats for badge display */
  stats?: {
    attack: number;
    move: number;
    shield?: number;
  };
}

export function Figure({ coord, hexSize, type, label, hp, maxHp, conditions, isTargetable, onClick, stats }: FigureProps) {
  const pixel = hexToPixel(coord, hexSize);
  const radius = hexSize * 0.38;
  const color = FIGURE_COLORS[type];
  const hpPercent = maxHp > 0 ? hp / maxHp : 0;
  const isMonster = type !== 'character';
  const isElite = type === 'monster-elite';

  return (
    <g
      className={`figure-token ${isTargetable ? 'figure-targetable' : ''}`}
      style={{ color }}
      onClick={onClick}
      transform={`translate(${pixel.x}, ${pixel.y})`}
    >
      {/* Shadow */}
      <ellipse cx={0} cy={3} rx={radius * 0.9} ry={radius * 0.3} fill="rgba(0,0,0,0.4)" />

      {/* Main circle */}
      <circle cx={0} cy={0} r={radius} fill={color} opacity={0.9} />
      <circle cx={0} cy={0} r={radius} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />

      {/* Elite crown indicator */}
      {isElite && (
        <g transform={`translate(0, ${-radius - 10})`}>
          <polygon
            points="-6,4 -4,-1 -1,2 0,-3 1,2 4,-1 6,4"
            fill="#d4a020"
            stroke="#fff"
            strokeWidth={0.5}
          />
        </g>
      )}

      {/* HP bar background */}
      <rect
        x={-radius * 0.8}
        y={radius + 3}
        width={radius * 1.6}
        height={4}
        rx={2}
        fill="rgba(0,0,0,0.6)"
      />
      {/* HP bar fill */}
      <rect
        x={-radius * 0.8}
        y={radius + 3}
        width={radius * 1.6 * hpPercent}
        height={4}
        rx={2}
        fill={hpPercent > 0.5 ? 'var(--color-health-green-bright)' : hpPercent > 0.25 ? 'var(--color-gold)' : 'var(--color-blood-red-bright)'}
      />

      {/* Label */}
      <text
        x={0}
        y={2}
        textAnchor="middle"
        fontSize={type === 'character' ? 11 : 9}
        fontWeight="bold"
        fill="white"
      >
        {type === 'character' ? 'J' : label.charAt(0).toUpperCase()}
      </text>

      {/* HP text */}
      <text
        x={0}
        y={radius + 14}
        textAnchor="middle"
        fontSize={8}
        fill="var(--color-text-secondary)"
      >
        {hp}/{maxHp}
      </text>

      {/* Monster stat badges */}
      {isMonster && stats && (
        <g transform={`translate(${radius + 4}, ${-radius * 0.3})`}>
          {/* ATK badge */}
          <g transform="translate(0, 0)">
            <rect x={-1} y={-5} width={16} height={10} rx={3} fill="rgba(196, 42, 42, 0.85)" />
            {/* Sword mini icon */}
            <line x1={1} y1={3} x2={5} y2={-3} stroke="white" strokeWidth={1} />
            <text x={10} y={2.5} textAnchor="middle" fontSize={6} fill="white" fontWeight="bold">
              {stats.attack}
            </text>
          </g>
          {/* MOV badge */}
          <g transform="translate(0, 12)">
            <rect x={-1} y={-5} width={16} height={10} rx={3} fill="rgba(74, 158, 255, 0.7)" />
            {/* Boot mini icon */}
            <circle cx={4} cy={0} r={2} fill="white" opacity={0.6} />
            <text x={10} y={2.5} textAnchor="middle" fontSize={6} fill="white" fontWeight="bold">
              {stats.move}
            </text>
          </g>
          {/* Shield badge (if any) */}
          {stats.shield !== undefined && stats.shield > 0 && (
            <g transform="translate(0, 24)">
              <rect x={-1} y={-5} width={16} height={10} rx={3} fill="rgba(100, 140, 180, 0.7)" />
              <text x={8} y={2.5} textAnchor="middle" fontSize={6} fill="white" fontWeight="bold">
                {stats.shield}
              </text>
            </g>
          )}
        </g>
      )}

      {/* Condition indicators */}
      {conditions && conditions.length > 0 && (
        <g>
          {conditions.map((condition, i) => {
            const offsetX = (i - (conditions.length - 1) / 2) * 8;
            const condY = isElite ? -radius - 16 : -radius - 6;
            return (
              <g key={condition} transform={`translate(${offsetX}, ${condY})`}>
                <circle r={4} fill={CONDITION_COLORS[condition]} stroke="rgba(0,0,0,0.5)" strokeWidth={0.5} />
                <text textAnchor="middle" y={2.5} fontSize={5} fill="white" fontWeight="bold">
                  {CONDITION_LABELS[condition]}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Targetable ring */}
      {isTargetable && (
        <circle
          cx={0} cy={0} r={radius + 4}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.8}
        />
      )}
    </g>
  );
}
