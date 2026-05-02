import type { Card, CardRank } from './holdemTypes';

/**
 * Category rank for MVP ordering (higher = stronger).
 * Straight flush is treated as flush per training MVP rules.
 */
const CAT_HIGH_CARD = 1;
const CAT_PAIR = 2;
const CAT_TWO_PAIR = 3;
const CAT_TRIPS = 4;
const CAT_STRAIGHT = 5;
const CAT_FLUSH = 6;
const CAT_FULL_HOUSE = 7;
const CAT_FOUR_KIND = 8;

export type HandStrength = readonly number[];

function compareTuples(a: readonly number[], b: readonly number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) {
      return 1;
    }
    if (av < bv) {
      return -1;
    }
  }
  return 0;
}

function sortRanksDesc(ranks: CardRank[]): CardRank[] {
  return [...ranks].sort((x, y) => y - x);
}

function isFlushFive(cards: Card[]): boolean {
  const s = cards[0].suit;
  return cards.every((c) => c.suit === s);
}

/**
 * Returns high card of the straight, or 0 if not a straight.
 * Wheel is A-2-3-4-5 (high card 5 for kickers).
 */
function straightHighCard(ranks: CardRank[]): CardRank | 0 {
  const unique = Array.from(new Set(ranks)).sort((a, b) => a - b);
  if (unique.length < 5) {
    return 0;
  }
  // Check A-2-3-4-5 wheel
  if (
    unique.includes(14) &&
    unique.includes(2) &&
    unique.includes(3) &&
    unique.includes(4) &&
    unique.includes(5)
  ) {
    return 5;
  }
  for (let i = 0; i <= unique.length - 5; i++) {
    let run = true;
    for (let j = 1; j < 5; j++) {
      if (unique[i + j] !== unique[i] + j) {
        run = false;
        break;
      }
    }
    if (run) {
      return unique[i + 4];
    }
  }
  return 0;
}

function countRanks(cards: Card[]): Map<CardRank, number> {
  const m = new Map<CardRank, number>();
  for (const c of cards) {
    m.set(c.rank, (m.get(c.rank) ?? 0) + 1);
  }
  return m;
}

/**
 * Score exactly 5 cards (MVP categories only).
 */
export function scoreFiveCards(cards: Card[]): HandStrength {
  if (cards.length !== 5) {
    throw new Error('scoreFiveCards: need exactly 5 cards');
  }
  const ranks = cards.map((c) => c.rank);
  const flush = isFlushFive(cards);
  const straightHigh = straightHighCard(ranks);

  if (flush) {
    const kickers = sortRanksDesc(ranks);
    if (straightHigh) {
      // Straight flush still reported as flush category for MVP
      return [CAT_FLUSH, straightHigh, ...kickers.slice(0, 4)];
    }
    return [CAT_FLUSH, ...kickers];
  }

  if (straightHigh) {
    return [CAT_STRAIGHT, straightHigh];
  }

  const cm = countRanks(cards);
  const byCount = Array.from(cm.entries()).sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }
    return b[0] - a[0];
  });

  const quads = byCount.find(([, n]) => n === 4);
  if (quads) {
    const kicker = byCount.find(([, n]) => n === 1)?.[0] ?? 0;
    return [CAT_FOUR_KIND, quads[0], kicker];
  }
  const trips = byCount.find(([, n]) => n === 3);
  const pairs = byCount.filter(([, n]) => n === 2).map(([r]) => r);
  if (trips && pairs.length >= 1) {
    return [CAT_FULL_HOUSE, trips[0], pairs[0]];
  }
  if (trips) {
    const kickers = byCount
      .filter(([, n]) => n === 1)
      .map(([r]) => r)
      .sort((a, b) => b - a);
    return [CAT_TRIPS, trips[0], ...kickers];
  }
  if (pairs.length >= 2) {
    const [h, l] = sortRanksDesc(pairs);
    const kicker = byCount.find(([, n]) => n === 1)?.[0] ?? 0;
    return [CAT_TWO_PAIR, h, l, kicker];
  }
  if (pairs.length === 1) {
    const kickerRanks = byCount
      .filter(([, n]) => n === 1)
      .map(([r]) => r)
      .sort((a, b) => b - a);
    return [CAT_PAIR, pairs[0], ...kickerRanks];
  }

  return [CAT_HIGH_CARD, ...sortRanksDesc(ranks)];
}

function combinations5(cards: Card[]): Card[][] {
  const n = cards.length;
  if (n < 5) {
    return [];
  }
  const out: Card[][] = [];
  function rec(start: number, acc: Card[]): void {
    if (acc.length === 5) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i <= n - (5 - acc.length); i++) {
      acc.push(cards[i]);
      rec(i + 1, acc);
      acc.pop();
    }
  }
  rec(0, []);
  return out;
}

/**
 * Best 5 of 7 (2 hole + 5 board). Board may be shorter pre-hand-end; use available cards.
 */
export function evaluateHoldemHand(hole: Card[], board: Card[]): HandStrength {
  const all = [...hole, ...board];
  if (all.length < 5) {
    throw new Error('evaluateHoldemHand: need at least 5 total cards');
  }
  const combos = combinations5(all);
  let best: HandStrength = scoreFiveCards(combos[0]);
  for (const five of combos) {
    const s = scoreFiveCards(five);
    if (compareHandStrength(s, best) > 0) {
      best = s;
    }
  }
  return best;
}

export function compareHandStrength(a: HandStrength, b: HandStrength): number {
  return compareTuples(a, b);
}

/**
 * Debug / display: monotonic with compareHandStrength (approximate for non-integer categories).
 */
export function numericRanking(strength: HandStrength): number {
  let n = 0;
  for (let i = 0; i < Math.min(strength.length, 8); i++) {
    n = n * 15 + (strength[i] ?? 0);
  }
  return n;
}

// Re-export category constants for tests / UI
export const HandCategory = {
  HIGH_CARD: CAT_HIGH_CARD,
  PAIR: CAT_PAIR,
  TWO_PAIR: CAT_TWO_PAIR,
  TRIPS: CAT_TRIPS,
  STRAIGHT: CAT_STRAIGHT,
  FLUSH: CAT_FLUSH,
  FULL_HOUSE: CAT_FULL_HOUSE,
  FOUR_KIND: CAT_FOUR_KIND,
} as const;
