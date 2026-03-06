import React from 'react';

export type IconName =
  | 'attack' | 'move' | 'shield' | 'heal' | 'range' | 'push' | 'pull'
  | 'pierce' | 'poison' | 'wound' | 'muddle' | 'immobilize' | 'stun'
  | 'disarm' | 'invisible' | 'strengthen' | 'retaliate' | 'loot' | 'jump'
  | 'fire' | 'ice' | 'air' | 'earth' | 'light' | 'dark'
  | 'crown' | 'target';

interface ActionIconProps {
  icon: IconName;
  size?: number;
  className?: string;
  color?: string;
}

export function ActionIcon({ icon, size = 16, className = '', color }: ActionIconProps) {
  const s = size;
  const style = color ? { color } : undefined;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block ${className}`}
      style={style}
    >
      {getIconPath(icon)}
    </svg>
  );
}

function getIconPath(icon: IconName): React.ReactNode {
  switch (icon) {
    // ─── Sword (Attack) ─────────────────────────────────────
    case 'attack':
      return (
        <>
          {/* Blade */}
          <path d="M19 3l-7 7" strokeWidth={2.5} />
          <path d="M15 3h4v4" />
          {/* Guard */}
          <line x1="8" y1="13" x2="11" y2="10" strokeWidth={2.5} />
          {/* Handle */}
          <line x1="5" y1="19" x2="9" y2="15" strokeWidth={2} />
          <line x1="3" y1="21" x2="5" y2="19" strokeWidth={3} />
        </>
      );
    // ─── Boot (Move) ────────────────────────────────────────
    case 'move':
      return (
        <path d="M8 22h8l2-5-2-2v-3c0-1.5-1-3-2.5-3S11 10.5 11 12v1l-2 2-2 3z"
          fill="currentColor" opacity={0.25} stroke="currentColor" strokeWidth={1.5} />
      );
    // ─── Shield ─────────────────────────────────────────────
    case 'shield':
      return (
        <path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7z" fill="currentColor" opacity={0.2} />
      );
    // ─── Heart (Heal) ───────────────────────────────────────
    case 'heal':
      return (
        <path d="M12 21C12 21 4 14 4 9.5a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8c0 4.5-8 11.5-8 11.5z" fill="currentColor" opacity={0.3} />
      );
    // ─── Crosshair (Range) ──────────────────────────────────
    case 'range':
      return (
        <>
          <circle cx={12} cy={12} r={8} />
          <circle cx={12} cy={12} r={3} />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </>
      );
    // ─── Arrow Right (Push) ─────────────────────────────────
    case 'push':
      return (
        <>
          <line x1="4" y1="12" x2="20" y2="12" />
          <polyline points="14,6 20,12 14,18" />
        </>
      );
    // ─── Arrow Left (Pull) ──────────────────────────────────
    case 'pull':
      return (
        <>
          <line x1="20" y1="12" x2="4" y2="12" />
          <polyline points="10,6 4,12 10,18" />
        </>
      );
    // ─── Diamond (Pierce) ───────────────────────────────────
    case 'pierce':
      return (
        <polygon points="12,2 22,12 12,22 2,12" fill="currentColor" opacity={0.2} />
      );
    // ─── Skull (Poison) ─────────────────────────────────────
    case 'poison':
      return (
        <>
          <circle cx={12} cy={10} r={7} fill="currentColor" opacity={0.15} />
          <circle cx={9} cy={9} r={1.5} fill="currentColor" />
          <circle cx={15} cy={9} r={1.5} fill="currentColor" />
          <path d="M9 14h6" />
          <line x1="10" y1="14" x2="10" y2="17" />
          <line x1="14" y1="14" x2="14" y2="17" />
        </>
      );
    // ─── Droplet (Wound) ────────────────────────────────────
    case 'wound':
      return (
        <path d="M12 3C12 3 5 11 5 15a7 7 0 0 0 14 0c0-4-7-12-7-12z" fill="currentColor" opacity={0.3} />
      );
    // ─── Spiral (Muddle) ────────────────────────────────────
    case 'muddle':
      return (
        <path d="M12 3c-5 0-7 4-7 7s3 5 7 5 5-2 5-5-2-4-5-4-3 1-3 3 1 2 3 2" fill="none" />
      );
    // ─── Chain (Immobilize) ─────────────────────────────────
    case 'immobilize':
      return (
        <>
          <circle cx={9} cy={12} r={4} fill="none" />
          <circle cx={15} cy={12} r={4} fill="none" />
        </>
      );
    // ─── Stun (star burst) ──────────────────────────────────
    case 'stun':
      return (
        <polygon
          points="12,2 14,9 21,9 15.5,13.5 17.5,21 12,16 6.5,21 8.5,13.5 3,9 10,9"
          fill="currentColor" opacity={0.25}
        />
      );
    // ─── Disarm ─────────────────────────────────────────────
    case 'disarm':
      return (
        <>
          <circle cx={12} cy={12} r={9} />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      );
    // ─── Invisible (eye with slash) ─────────────────────────
    case 'invisible':
      return (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" />
          <circle cx={12} cy={12} r={3} fill="none" />
          <line x1="4" y1="4" x2="20" y2="20" />
        </>
      );
    // ─── Strengthen (chevrons up) ───────────────────────────
    case 'strengthen':
      return (
        <>
          <polyline points="6,15 12,9 18,15" />
          <polyline points="6,20 12,14 18,20" />
        </>
      );
    // ─── Retaliate (reflect arrows) ─────────────────────────
    case 'retaliate':
      return (
        <>
          <polyline points="4,8 8,4 12,8" />
          <line x1="8" y1="4" x2="8" y2="14" />
          <polyline points="20,16 16,20 12,16" />
          <line x1="16" y1="20" x2="16" y2="10" />
        </>
      );
    // ─── Coin (Loot) ────────────────────────────────────────
    case 'loot':
      return (
        <>
          <circle cx={12} cy={12} r={9} fill="currentColor" opacity={0.15} />
          <text x={12} y={16} textAnchor="middle" fontSize={12} fill="currentColor" fontWeight="bold" stroke="none">$</text>
        </>
      );
    // ─── Wing (Jump) ────────────────────────────────────────
    case 'jump':
      return (
        <path d="M4 16c2-8 6-12 8-12s6 4 8 12" fill="none" />
      );
    // ─── Target (multi-target) ──────────────────────────────
    case 'target':
      return (
        <>
          <circle cx={12} cy={12} r={9} />
          <circle cx={12} cy={12} r={5} />
          <circle cx={12} cy={12} r={1} fill="currentColor" />
        </>
      );
    // ─── Elements ───────────────────────────────────────────
    case 'fire':
      return <path d="M12 3c0 5-4 6-4 10a4 4 0 0 0 8 0c0-4-4-5-4-10z" fill="#e84040" opacity={0.8} stroke="#e84040" />;
    case 'ice':
      return (
        <>
          <line x1="12" y1="2" x2="12" y2="22" stroke="#4a9ade" />
          <line x1="4" y1="7" x2="20" y2="17" stroke="#4a9ade" />
          <line x1="20" y1="7" x2="4" y2="17" stroke="#4a9ade" />
        </>
      );
    case 'air':
      return (
        <>
          <path d="M5 12h10a3 3 0 1 0-3-3" fill="none" stroke="#b0b8c0" />
          <path d="M3 17h8a2 2 0 1 0-2-2" fill="none" stroke="#b0b8c0" />
        </>
      );
    case 'earth':
      return <polygon points="12,3 21,9 18,20 6,20 3,9" fill="#7a6030" opacity={0.6} stroke="#7a6030" />;
    case 'light':
      return (
        <>
          <circle cx={12} cy={12} r={5} fill="#f0d860" opacity={0.4} stroke="#f0d860" />
          <line x1="12" y1="2" x2="12" y2="5" stroke="#f0d860" />
          <line x1="12" y1="19" x2="12" y2="22" stroke="#f0d860" />
          <line x1="2" y1="12" x2="5" y2="12" stroke="#f0d860" />
          <line x1="19" y1="12" x2="22" y2="12" stroke="#f0d860" />
        </>
      );
    case 'dark':
      return (
        <path d="M12 3a9 9 0 0 0 0 18 7 7 0 0 1 0-18z" fill="#5a3a8a" opacity={0.7} stroke="#5a3a8a" />
      );
    // ─── Crown (Elite) ──────────────────────────────────────
    case 'crown':
      return (
        <polygon points="3,18 5,10 9,14 12,6 15,14 19,10 21,18" fill="currentColor" opacity={0.4} />
      );
    default:
      return <circle cx={12} cy={12} r={8} />;
  }
}
