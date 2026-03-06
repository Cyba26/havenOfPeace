'use client';
import React, { useState } from 'react';
import type { MonsterInstance, MonsterDef } from '@/types/monsters';
import { ActionIcon } from '@/components/icons/ActionIcon';
import { t } from '@/i18n';

interface MonsterPanelProps {
  monsters: Map<string, MonsterInstance>;
  monsterDefs: Record<string, MonsterDef>;
}

export function MonsterPanel({ monsters, monsterDefs }: MonsterPanelProps) {
  const [open, setOpen] = useState(false);
  const allMonsters = Array.from(monsters.values());
  const alive = allMonsters.filter(m => m.currentHP > 0);
  const dead = allMonsters.filter(m => m.currentHP <= 0);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-gold-dim)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <ActionIcon icon="attack" size={12} color="var(--color-blood-red-bright)" />
        <span>{alive.length}/{allMonsters.length}</span>
        <span className="text-[8px]">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute top-0 left-full ml-2 rounded-lg p-3 w-72 max-h-80 overflow-y-auto"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-gold-dim)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 80,
          }}
        >
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-gold)', fontFamily: 'var(--font-display)' }}>
            Monstres
          </div>

          {alive.map(m => {
            const def = monsterDefs[m.defId];
            if (!def) return null;
            const hpPercent = m.maxHP > 0 ? m.currentHP / m.maxHP : 0;
            return (
              <div
                key={m.instanceId}
                className="flex items-center gap-2 p-2 rounded mb-1"
                style={{ background: 'var(--color-bg-tertiary)' }}
              >
                {/* Color dot */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: m.isElite ? 'var(--color-monster-elite)' : 'var(--color-monster-normal)' }}
                >
                  {m.isElite && <ActionIcon icon="crown" size={10} color="white" />}
                  {!m.isElite && def.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {def.name}
                    </span>
                    {m.isElite && (
                      <span className="text-[7px] px-1 rounded font-bold" style={{ background: 'var(--color-monster-elite)', color: '#fff' }}>
                        {t('elite').toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* HP bar */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-bg-primary)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${hpPercent * 100}%`,
                          background: hpPercent > 0.5 ? 'var(--color-health-green-bright)' : hpPercent > 0.25 ? 'var(--color-gold)' : 'var(--color-blood-red-bright)',
                        }}
                      />
                    </div>
                    <span className="text-[9px]" style={{ color: 'var(--color-text-secondary)' }}>{m.currentHP}/{m.maxHP}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-[8px] flex items-center gap-0.5" style={{ color: 'var(--color-blood-red-bright)' }}>
                      <ActionIcon icon="attack" size={8} /> {def.baseAttack}
                    </span>
                    <span className="text-[8px] flex items-center gap-0.5" style={{ color: 'var(--color-ice-blue)' }}>
                      <ActionIcon icon="move" size={8} /> {def.baseMove}
                    </span>
                    {def.shield !== undefined && def.shield > 0 && (
                      <span className="text-[8px] flex items-center gap-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        <ActionIcon icon="shield" size={8} /> {def.shield}
                      </span>
                    )}
                    {def.isRanged && (
                      <span className="text-[8px] flex items-center gap-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        <ActionIcon icon="range" size={8} />
                      </span>
                    )}
                  </div>

                  {/* Conditions */}
                  {m.conditions.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {m.conditions.map(c => (
                        <span key={c} className="text-[7px] px-0.5 rounded" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-muted)' }}>
                          {t(`condition.${c}`)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {dead.length > 0 && (
            <>
              <div className="text-[8px] uppercase tracking-wider mt-2 mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Vaincus
              </div>
              {dead.map(m => {
                const def = monsterDefs[m.defId];
                return (
                  <div key={m.instanceId} className="text-[9px] py-0.5 line-through" style={{ color: 'var(--color-text-muted)' }}>
                    {def?.name ?? m.defId} {m.isElite ? `(${t('elite')})` : ''}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </>
  );
}
