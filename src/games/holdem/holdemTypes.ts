import type { GameState, Player, PlayerAction } from '@/games/shared';

/** Rank 2 = 2, …, 14 = Ace (high). */
export type CardRank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type CardSuit = 'h' | 'd' | 'c' | 's';

export interface Card {
  rank: CardRank;
  suit: CardSuit;
}

/** Remaining deck is an immutable stack (end = top). */
export type Deck = Card[];

export type HoldemPhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export const HOLDEM_METADATA_KEY = 'gameKind' as const;
export const HOLDEM_GAME_KIND = 'holdem' as const;

export interface HoldemMetadata extends Record<string, unknown> {
  [HOLDEM_METADATA_KEY]: typeof HOLDEM_GAME_KIND;
  /** Heads-up: dealer posts SB; multi-way: SB/BB are next clockwise from button. */
  smallBlindAmount: number;
  bigBlindAmount: number;
  /** Minimum raise increment (MVP: fixed, e.g. big blind). */
  minRaiseIncrement: number;
  /** Set when the hand ended because everyone else folded. */
  foldWinnerId?: string;
}

export interface HoldemPlayerState extends Player {
  hand: Card[];
  chips: number;
  /** Chips committed on the current betting street. */
  currentBet: number;
  folded: boolean;
}

export interface HoldemGameState extends GameState {
  players: HoldemPlayerState[];
  phase: HoldemPhase;
  metadata: HoldemMetadata & Record<string, unknown>;
  deck: Deck;
  communityCards: Card[];
  pot: number;
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  /**
   * Face bet for the current street — amount each non-folded player must match
   * this street (everyone's currentBet should equal this when caught up).
   */
  currentBet: number;
  /** Seat index of the player who made the last full raise this street; BB starts preflop. */
  lastAggressorIndex: number;
  /** Player ids that must still act at the current bet level (empty ⇒ street can end if matched). */
  responseNeeded: Set<string>;
}

/** Namespaced action types for PlayerAction.type */
export const HOLDEM_ACTION = {
  FOLD: 'holdem_fold',
  CHECK: 'holdem_check',
  CALL: 'holdem_call',
  RAISE: 'holdem_raise',
} as const;

export type HoldemActionType = (typeof HOLDEM_ACTION)[keyof typeof HOLDEM_ACTION];

export function isHoldemState(state: GameState): state is HoldemGameState {
  return state.metadata[HOLDEM_METADATA_KEY] === HOLDEM_GAME_KIND;
}

export function assertHoldemState(state: GameState): HoldemGameState {
  if (!isHoldemState(state)) {
    throw new Error('Expected HoldemGameState');
  }
  return state;
}

export function makeHoldemAction(
  type: HoldemActionType,
  playerId: string,
  payload: Record<string, unknown> = {},
  timestamp: number = Date.now(),
): PlayerAction {
  return { type, playerId, payload, timestamp };
}
