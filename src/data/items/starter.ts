import type { ItemDef } from '@/types/items';

export const healthPotion: ItemDef = {
  id: 'health-potion',
  name: 'Potion de Soin',
  slot: 'generic',
  usage: 'lost',
  actions: [{ type: 'heal', value: 3 }],
  description: 'Soin de 3 PV. Perdu apr\u00e8s utilisation.',
};

export const leatherArmor: ItemDef = {
  id: 'leather-armor',
  name: 'Armure de Cuir',
  slot: 'generic',
  usage: 'spent',
  actions: [{ type: 'shield', value: 1 }],
  description: 'Bouclier 1 quand attaqu\u00e9. R\u00e9cup\u00e9r\u00e9 au repos long.',
};

export const ironHelm: ItemDef = {
  id: 'iron-helm',
  name: 'Casque de Fer',
  slot: 'generic',
  usage: 'spent',
  actions: [{ type: 'shield', value: 1 }],
  description: 'Bouclier 1 quand attaqu\u00e9. R\u00e9cup\u00e9r\u00e9 au repos long.',
};

export const shortSword: ItemDef = {
  id: 'short-sword',
  name: '\u00c9p\u00e9e Courte',
  slot: 'single-hand',
  usage: 'passive',
  actions: [{ type: 'attack', value: 1 }],
  description: '+1 Attaque en m\u00eal\u00e9e (passif).',
};

export const longBow: ItemDef = {
  id: 'long-bow',
  name: 'Arc Long',
  slot: 'dual-hand',
  usage: 'passive',
  actions: [{ type: 'attack', value: 1, range: 4 }],
  description: '+1 Attaque \u00e0 distance (passif).',
};

export const bootOfSpeed: ItemDef = {
  id: 'boots-of-speed',
  name: 'Bottes de Vitesse',
  slot: 'generic',
  usage: 'spent',
  actions: [{ type: 'move', value: 2 }],
  description: '+2 D\u00e9placement. R\u00e9cup\u00e9r\u00e9 au repos long.',
};

export const ALL_ITEMS: Record<string, ItemDef> = {
  'health-potion': healthPotion,
  'leather-armor': leatherArmor,
  'iron-helm': ironHelm,
  'short-sword': shortSword,
  'long-bow': longBow,
  'boots-of-speed': bootOfSpeed,
};
