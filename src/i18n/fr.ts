/** French translations for Haven of Peace */
const fr: Record<string, string> = {
  // ─── Title / Setup ──────────────────────────────────────
  title: 'Haven of Peace',
  subtitle: 'Un jeu de cartes et de donjons en solo inspir\u00e9 de Gloomhaven: Buttons & Bugs',
  begin: 'Commencer',

  // ─── Scenarios ──────────────────────────────────────────
  'scenario.gatehouse': 'Le Corps de Garde',
  'scenario.gatehouse.desc': '\u00c9liminez les gardes qui bloquent le passage du vieux corps de garde.',
  'scenario.ambush': "L'Embuscade",
  'scenario.ambush.desc': 'Frayez-vous un chemin \u00e0 travers une embuscade avec un garde \u00e9lite.',
  enemies: 'ennemis',
  elite: '\u00e9lite',

  // ─── Victory / Defeat ──────────────────────────────────
  victory: 'Victoire !',
  defeated: 'D\u00e9faite...',
  victory_desc: 'Tous les ennemis ont \u00e9t\u00e9 vaincus.',
  defeat_desc: 'Votre qu\u00eate s\'est sold\u00e9e par un \u00e9chec.',
  play_again: 'Rejouer',
  battle_log: 'Journal de Combat',
  round_label: 'Manche',
  hp_remaining: 'PV restants',

  // ─── Status Bar ─────────────────────────────────────────
  round: 'Manche',
  hp: 'PV',
  hand: 'Main',
  discard: 'D\u00e9fausse',
  lost: 'Perdu',

  // ─── Phase Labels ───────────────────────────────────────
  'phase.SCENARIO_SETUP': 'Pr\u00e9paration',
  'phase.CARD_SELECTION': 'S\u00e9lection des Cartes',
  'phase.INITIATIVE_RESOLUTION': 'Initiative',
  'phase.PLAYER_TURN': 'Votre Tour',
  'phase.MONSTER_TURN': 'Tour des Monstres',
  'phase.END_OF_ROUND': 'Fin de Manche',
  'phase.RESTING': 'Repos',
  'phase.SCENARIO_COMPLETE': 'Victoire !',
  'phase.SCENARIO_FAILED': 'D\u00e9faite',

  // ─── Card Selection ────────────────────────────────────
  select_cards: 'S\u00e9lectionnez 2 Cartes',
  confirm_selection: 'Confirmer la S\u00e9lection',

  // ─── Player Turn ───────────────────────────────────────
  assign_actions: 'Assigner les Actions',
  select_destination: 'Choisir la Destination',
  select_destination_hint: 'Cliquez sur une case illumin\u00e9e pour vous d\u00e9placer.',
  select_target: 'Choisir la Cible',
  select_target_hint: 'Cliquez sur un ennemi brillant pour attaquer.',
  turn_complete: 'Tour Termin\u00e9',
  end_turn: 'Fin du Tour',
  executing: 'Ex\u00e9cution des actions...',

  // ─── Card Selector ─────────────────────────────────────
  top_action: 'Action du Haut depuis :',
  bottom_action: 'Action du Bas depuis :',
  default_atk: 'D\u00e9faut (Atq 2)',
  default_move: 'D\u00e9faut (D\u00e9p 2)',
  execute_actions: 'Ex\u00e9cuter les Actions',

  // ─── Monster Turn ──────────────────────────────────────
  monster_turn: 'Tour des Monstres',
  execute_monster: 'Ex\u00e9cuter les Actions Ennemies',

  // ─── Resting ───────────────────────────────────────────
  long_rest: 'Repos Long',
  long_rest_choose: 'Repos Long \u2014 Choisir une Carte \u00e0 Perdre',
  long_rest_desc: 'Soins de 2 PV. Choisissez une carte \u00e0 perdre d\u00e9finitivement :',
  short_rest: 'Repos Court',
  reroll: 'Relancer (\u22121 PV)',
  rerolled: 'Relanc\u00e9 \u2014 perdu :',

  // ─── End of Round ──────────────────────────────────────
  end_of_round: 'Fin de Manche',
  next_round: 'Manche Suivante',

  // ─── Damage Negation ───────────────────────────────────
  incoming_damage: 'D\u00e9g\u00e2ts Re\u00e7us',
  damage_choose: 'Choisissez votre r\u00e9ponse :',
  accept_damage: 'Accepter {n} D\u00e9g\u00e2ts',
  discard_a: 'D\u00e9fausser 1 carte face A (annuler)',
  discard_2b: 'D\u00e9fausser 2 cartes face B (annuler)',
  lose_card: 'Perdre 1 carte (annuler)',
  discard_a_pick: 'D\u00e9faussez une carte face A :',
  discard_2b_pick: 'S\u00e9lectionnez 2 cartes face B \u00e0 d\u00e9fausser :',
  lose_card_pick: 'Perdez une carte pour annuler :',
  back: 'Retour',
  selected: 's\u00e9lectionn\u00e9',

  // ─── Items ─────────────────────────────────────────────
  items: 'Objets',
  spent: '\u00e9puis\u00e9',
  lost_item: 'perdu',
  passive: 'passif',
  consumable: 'consommable',
  recoverable: 'r\u00e9cup\u00e9rable',

  // ─── Card parts ────────────────────────────────────────
  top: 'Haut',
  bottom: 'Bas',
  init_badge: 'INIT',

  // ─── Actions ───────────────────────────────────────────
  'action.attack': 'Attaque',
  'action.move': 'D\u00e9placement',
  'action.heal': 'Soin',
  'action.shield': 'Bouclier',
  'action.push': 'Pouss\u00e9e',
  'action.pull': 'Tirage',
  'action.retaliate': 'R\u00e9plique',
  'action.loot': 'Butin',
  'action.condition': 'Condition',
  'action.range': 'Port\u00e9e',
  'action.pierce': 'Perc\u00e9e',
  'action.jump': 'Saut',
  'action.target': 'Cibles',
  'action.aoe': 'Zone',

  // ─── Conditions ────────────────────────────────────────
  'condition.wound': 'Blessure',
  'condition.poison': 'Poison',
  'condition.immobilize': 'Immobilis\u00e9',
  'condition.disarm': 'D\u00e9sarm\u00e9',
  'condition.muddle': 'Confusion',
  'condition.invisible': 'Invisible',
  'condition.strengthen': 'Renforc\u00e9',

  // ─── Elements ──────────────────────────────────────────
  'element.fire': 'Feu',
  'element.ice': 'Glace',
  'element.air': 'Air',
  'element.earth': 'Terre',
  'element.light': 'Lumi\u00e8re',
  'element.dark': 'T\u00e9n\u00e8bres',
  infused: 'infus\u00e9',

  // ─── Monsters ──────────────────────────────────────────
  'monster.guard': 'Garde',
  'monster.archer': 'Archer',

  // ─── Cards ─────────────────────────────────────────────
  'card.crushing-blow': 'Coup D\u00e9vastateur',
  'card.iron-stance': 'Posture de Fer',
  'card.sweeping-strike': 'Frappe Circulaire',
  'card.battle-fury': 'Furie Guerri\u00e8re',
  'card.earthquake-slam': 'S\u00e9isme D\u00e9vastateur',
  'card.iron-bulwark': 'Rempart de Fer',
  'card.berserker-charge': 'Charge Berserker',
  'card.stone-skin': 'Peau de Pierre',

  // ─── Items ─────────────────────────────────────────────
  'item.health-potion': 'Potion de Soin',
  'item.health-potion.desc': 'Soin de 3 PV. Perdu apr\u00e8s utilisation.',
  'item.leather-armor': 'Armure de Cuir',
  'item.leather-armor.desc': 'Bouclier 1 quand attaqu\u00e9. R\u00e9cup\u00e9r\u00e9 au repos long.',
  'item.iron-helm': 'Casque de Fer',
  'item.iron-helm.desc': 'Bouclier 1 quand attaqu\u00e9. R\u00e9cup\u00e9r\u00e9 au repos long.',
  'item.short-sword': '\u00c9p\u00e9e Courte',
  'item.short-sword.desc': '+1 Attaque en m\u00eal\u00e9e (passif).',
  'item.long-bow': 'Arc Long',
  'item.long-bow.desc': '+1 Attaque \u00e0 distance (passif).',
  'item.boots-of-speed': 'Bottes de Vitesse',
  'item.boots-of-speed.desc': '+2 D\u00e9placement. R\u00e9cup\u00e9r\u00e9 au repos long.',

  // ─── Misc ──────────────────────────────────────────────
  no_cards: 'Aucune carte en main',
};

export default fr;
