import type { CardState, CardFace, AbilityCardDef } from '@/types/cards';

/** Get cards currently in hand */
export function getHandCards(cards: CardState[]): CardState[] {
  return cards.filter(c => c.location === 'hand');
}

/** Get cards in discard pile */
export function getDiscardedCards(cards: CardState[]): CardState[] {
  return cards.filter(c => c.location === 'discard');
}

/** Get cards in lost pile */
export function getLostCards(cards: CardState[]): CardState[] {
  return cards.filter(c => c.location === 'lost');
}

/** Can the player select 2 cards to play? */
export function canSelectCards(cards: CardState[]): boolean {
  return getHandCards(cards).length >= 2;
}

/** Can the player rest? (need cards in discard) */
export function canRest(cards: CardState[]): boolean {
  return getDiscardedCards(cards).length >= 1;
}

/**
 * Play a card: handle A/B side transitions.
 * - A-side played → flip to B-side, return to hand
 * - B-side played → move to discard
 * - If isLost → move to lost pile regardless
 */
export function playCard(card: CardState, isLost: boolean): CardState {
  if (isLost) {
    return { ...card, location: 'lost' };
  }

  if (card.currentSide === 'A') {
    return { ...card, currentSide: 'B' as CardFace, location: 'hand' };
  } else {
    return { ...card, location: 'discard' };
  }
}

/**
 * Short rest: recover all discarded cards to hand (flip B→A),
 * then lose one random card.
 * Returns updated cards array and the lost card's defId.
 */
export function performShortRest(cards: CardState[]): { cards: CardState[]; lostCardId: string | null } {
  const discarded = getDiscardedCards(cards);
  if (discarded.length === 0) return { cards, lostCardId: null };

  // Recover all discarded: flip to A-side, return to hand
  let updated = cards.map(c => {
    if (c.location === 'discard') {
      return { ...c, currentSide: 'A' as CardFace, location: 'hand' as const };
    }
    return c;
  });

  // Lose one random card from hand (from the recovered ones)
  const handCards = getHandCards(updated);
  if (handCards.length === 0) return { cards: updated, lostCardId: null };

  const randomIndex = Math.floor(Math.random() * handCards.length);
  const lostCard = handCards[randomIndex];

  updated = updated.map(c => {
    if (c.defId === lostCard.defId) {
      return { ...c, location: 'lost' as const };
    }
    return c;
  });

  return { cards: updated, lostCardId: lostCard.defId };
}

/**
 * Short rest reroll: lose a different random card instead (costs 1 HP).
 * Takes the current cards (with the first random card already lost) and the first lost card ID.
 * Un-loses the first card, then loses a different random card.
 */
export function shortRestReroll(
  cards: CardState[],
  previousLostId: string,
): { cards: CardState[]; newLostCardId: string | null } {
  // Un-lose the previous card (restore to hand, A-side since it was just recovered)
  let updated = cards.map(c => {
    if (c.defId === previousLostId && c.location === 'lost') {
      return { ...c, location: 'hand' as const, currentSide: 'A' as CardFace };
    }
    return c;
  });

  // Pick a different random card from hand
  const handCards = getHandCards(updated).filter(c => c.defId !== previousLostId);
  if (handCards.length === 0) {
    // No other card to lose, keep the original
    updated = cards;
    return { cards: updated, newLostCardId: previousLostId };
  }

  const randomIndex = Math.floor(Math.random() * handCards.length);
  const newLostCard = handCards[randomIndex];
  updated = updated.map(c => {
    if (c.defId === newLostCard.defId && c.location === 'hand') {
      return { ...c, location: 'lost' as const };
    }
    return c;
  });

  return { cards: updated, newLostCardId: newLostCard.defId };
}

/**
 * Long rest: recover all discarded cards, choose one to lose, heal 2.
 * The card choice is handled by the caller.
 */
export function performLongRestRecovery(cards: CardState[], chosenLostCardId: string): CardState[] {
  return cards.map(c => {
    if (c.defId === chosenLostCardId) {
      return { ...c, location: 'lost' as const };
    }
    if (c.location === 'discard') {
      return { ...c, currentSide: 'A' as CardFace, location: 'hand' as const };
    }
    return c;
  });
}

/**
 * Get A-side hand cards available for damage negation (discard 1 A-side = negate all damage)
 */
export function getASideHandCards(cards: CardState[]): CardState[] {
  return cards.filter(c => c.location === 'hand' && c.currentSide === 'A');
}

/**
 * Get B-side hand cards available for damage negation (discard 2 B-side = negate all damage)
 */
export function getBSideHandCards(cards: CardState[]): CardState[] {
  return cards.filter(c => c.location === 'hand' && c.currentSide === 'B');
}

/**
 * Get cards that can be lost to negate damage (any hand or discard card)
 */
export function getLossableCards(cards: CardState[]): CardState[] {
  return cards.filter(c => c.location === 'hand' || c.location === 'discard');
}

/**
 * Negate damage by discarding 1 A-side card from hand.
 * Returns updated cards array.
 */
export function negateByDiscardA(cards: CardState[], cardDefId: string): CardState[] {
  return cards.map(c => {
    if (c.defId === cardDefId && c.location === 'hand' && c.currentSide === 'A') {
      return { ...c, location: 'discard' as const };
    }
    return c;
  });
}

/**
 * Negate damage by discarding 2 B-side cards from hand.
 * Returns updated cards array.
 */
export function negateByDiscard2B(cards: CardState[], cardDefId1: string, cardDefId2: string): CardState[] {
  return cards.map(c => {
    if ((c.defId === cardDefId1 || c.defId === cardDefId2) && c.location === 'hand' && c.currentSide === 'B') {
      return { ...c, location: 'discard' as const };
    }
    return c;
  });
}

/**
 * Negate damage by losing 1 card from hand or discard.
 * Returns updated cards array.
 */
export function negateByLoseCard(cards: CardState[], cardDefId: string): CardState[] {
  return cards.map(c => {
    if (c.defId === cardDefId && (c.location === 'hand' || c.location === 'discard')) {
      return { ...c, location: 'lost' as const };
    }
    return c;
  });
}

/** Initialize card states for a character's card definitions */
export function initCardStates(cardDefs: AbilityCardDef[]): CardState[] {
  return cardDefs.map(def => ({
    defId: def.id,
    currentSide: 'A' as CardFace,
    location: 'hand' as const,
  }));
}

/** Get the initiative value for a card based on its current side */
export function getCardInitiative(def: AbilityCardDef, state: CardState): number {
  return state.currentSide === 'A' ? def.sideA.initiative : def.sideB.initiative;
}
