import type { ItemDef } from '@/types/items';

export const healthPotion: ItemDef = {
  id: 'health-potion',
  name: 'Health Potion',
  slot: 'generic',
  usage: 'lost',
  actions: [{ type: 'heal', value: 3 }],
  description: 'Heal 3 HP. Lost after use.',
};

export const leatherArmor: ItemDef = {
  id: 'leather-armor',
  name: 'Leather Armor',
  slot: 'generic',
  usage: 'spent',
  actions: [{ type: 'shield', value: 1 }],
  description: 'Shield 1 when attacked. Recovers on long rest.',
};

export const ironHelm: ItemDef = {
  id: 'iron-helm',
  name: 'Iron Helm',
  slot: 'generic',
  usage: 'spent',
  actions: [{ type: 'shield', value: 1 }],
  description: 'Shield 1 when attacked. Recovers on long rest.',
};

export const shortSword: ItemDef = {
  id: 'short-sword',
  name: 'Short Sword',
  slot: 'single-hand',
  usage: 'passive',
  actions: [{ type: 'attack', value: 1 }],
  description: '+1 Attack on melee attacks (passive).',
};

export const longBow: ItemDef = {
  id: 'long-bow',
  name: 'Long Bow',
  slot: 'dual-hand',
  usage: 'passive',
  actions: [{ type: 'attack', value: 1, range: 4 }],
  description: '+1 Attack on ranged attacks (passive).',
};

export const bootOfSpeed: ItemDef = {
  id: 'boots-of-speed',
  name: 'Boots of Speed',
  slot: 'generic',
  usage: 'spent',
  actions: [{ type: 'move', value: 2 }],
  description: '+2 Move on your next move action. Recovers on long rest.',
};

export const ALL_ITEMS: Record<string, ItemDef> = {
  'health-potion': healthPotion,
  'leather-armor': leatherArmor,
  'iron-helm': ironHelm,
  'short-sword': shortSword,
  'long-bow': longBow,
  'boots-of-speed': bootOfSpeed,
};
