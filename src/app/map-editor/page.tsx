'use client';
import React, { useState, useMemo } from 'react';
import type { HexMap } from '@/types/hex';
import { hexKey } from '@/engine/hex';
import { generateHexMap, getMonsterSpawns } from '@/engine/mapGenerator';
import { HexGrid } from '@/components/board/HexGrid';

export default function MapEditorPage() {
  const [radius, setRadius] = useState(3);
  const [obstaclePercent, setObstaclePercent] = useState(15);
  const [hazardPercent, setHazardPercent] = useState(10);
  const [difficultPercent, setDifficultPercent] = useState(15);
  const [seed, setSeed] = useState(42);
  const [monsterCount, setMonsterCount] = useState(3);
  const [copied, setCopied] = useState(false);

  const cells = useMemo(() =>
    generateHexMap({ radius, obstaclePercent, hazardPercent, difficultPercent, seed }),
    [radius, obstaclePercent, hazardPercent, difficultPercent, seed]
  );

  const monsterSpawns = useMemo(() =>
    getMonsterSpawns(cells, monsterCount, seed),
    [cells, monsterCount, seed]
  );

  const hexMap: HexMap = useMemo(() => {
    const map: HexMap = { cells: new Map() };
    cells.forEach(c => map.cells.set(hexKey(c.coord), c));
    return map;
  }, [cells]);

  const startPos = cells.find(c => c.isStartingHex)?.coord ?? { q: 0, r: 0 };

  // Build a monster map for display (using fake instances)
  const fakeMonsters = useMemo(() => {
    const m = new Map<string, any>();
    monsterSpawns.forEach((pos, i) => {
      m.set(`spawn-${i}`, {
        instanceId: `spawn-${i}`,
        defId: 'guard',
        position: pos,
        currentHP: 5,
        maxHP: 5,
        isElite: false,
        conditions: [],
        shield: 0,
      });
    });
    return m;
  }, [monsterSpawns]);

  const handleCopyJSON = () => {
    const json = {
      hexes: cells.map(c => ({
        q: c.coord.q,
        r: c.coord.r,
        terrain: c.terrain,
        ...(c.hazardDamage ? { hazardDamage: c.hazardDamage } : {}),
        ...(c.isStartingHex ? { isStartingHex: true } : {}),
      })),
      monsterSpawns,
    };
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const randomizeSeed = () => setSeed(Math.floor(Math.random() * 99999));

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Controls panel */}
      <div className="w-72 p-4 flex flex-col gap-4 overflow-y-auto"
        style={{ background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-gold-dim)' }}>
        <h1 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-gold)' }}>
          Editeur de Map
        </h1>

        <SliderControl label="Rayon" value={radius} min={2} max={5} onChange={setRadius} />
        <SliderControl label="% Obstacles" value={obstaclePercent} min={0} max={30} onChange={setObstaclePercent} />
        <SliderControl label="% Pièges" value={hazardPercent} min={0} max={20} onChange={setHazardPercent} />
        <SliderControl label="% Difficile" value={difficultPercent} min={0} max={30} onChange={setDifficultPercent} />
        <SliderControl label="Monstres" value={monsterCount} min={1} max={6} onChange={setMonsterCount} />

        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Seed
          </label>
          <div className="flex gap-1">
            <input
              type="number"
              value={seed}
              onChange={e => setSeed(Number(e.target.value))}
              className="flex-1 px-2 py-1 rounded text-xs"
              style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-gold-dim)' }}
            />
            <button onClick={randomizeSeed} className="btn-secondary text-xs px-2 py-1">
              Aléatoire
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <button onClick={handleCopyJSON} className="btn-primary text-sm py-2">
            {copied ? 'Copié !' : 'Copier JSON'}
          </button>
          <a href="/" className="btn-secondary text-sm py-2 text-center">
            Retour au jeu
          </a>
        </div>

        {/* Stats */}
        <div className="text-[10px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
          <div>Total hexes: {cells.length}</div>
          <div>Vides: {cells.filter(c => c.terrain === 'empty').length}</div>
          <div>Obstacles: {cells.filter(c => c.terrain === 'obstacle').length}</div>
          <div>Pièges: {cells.filter(c => c.terrain === 'hazard').length}</div>
          <div>Difficile: {cells.filter(c => c.terrain === 'difficult').length}</div>
          <div>Spawns monstres: {monsterSpawns.length}</div>
        </div>
      </div>

      {/* Map preview */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full h-full max-h-[80vh]">
          <HexGrid
            hexMap={hexMap}
            hexSize={50}
            characterPosition={startPos}
            characterHP={10}
            characterMaxHP={10}
            monsters={fakeMonsters}
            reachableHexes={null}
            validAttackTargets={null}
          />
        </div>
      </div>
    </div>
  );
}

function SliderControl({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
        <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-amber-500"
      />
    </div>
  );
}
