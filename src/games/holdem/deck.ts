import type { Card, CardRank, CardSuit, Deck } from './holdemTypes';

const SUITS: CardSuit[] = ['h', 'd', 'c', 's'];
const RANKS: CardRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/**
 * Build a standard 52-card deck (order: twos first, aces last, hearts/diamonds/clubs/spades).
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Fisher–Yates shuffle; returns a new array (immutable).
 */
export function shuffleDeck(deck: Deck): Deck {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Deal one card from the top of the deck (last element).
 */
export function dealCard(deck: Deck): { deck: Deck; card: Card } {
  if (deck.length === 0) {
    throw new Error('dealCard: deck is empty');
  }
  const card = deck[deck.length - 1];
  return { deck: deck.slice(0, -1), card };
}
