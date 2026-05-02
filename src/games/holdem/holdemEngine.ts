import type {
  GameEngine,
  GameResult,
  GameState,
  Player,
  PlayerAction,
} from '@/games/shared';
import { createDeck, dealCard, shuffleDeck } from './deck';
import { compareHandStrength, evaluateHoldemHand } from './handEvaluator';
import {
  assertHoldemState,
  HOLDEM_ACTION,
  HOLDEM_GAME_KIND,
  HOLDEM_METADATA_KEY,
  type HoldemGameState,
  type HoldemMetadata,
  type HoldemPlayerState,
  isHoldemState,
  makeHoldemAction,
} from './holdemTypes';

const STARTING_CHIPS = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const MIN_RAISE_INCREMENT = BIG_BLIND;

function newGameId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  return `holdem_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function computeBlindIndices(n: number, dealer: number): { sb: number; bb: number } {
  if (n === 2) {
    /** Heads-up: button posts SB, other posts BB; button acts first preflop. */
    return { sb: dealer, bb: (dealer + 1) % n };
  }
  return { sb: (dealer + 1) % n, bb: (dealer + 2) % n };
}

function firstPreflopActorIndex(bb: number, n: number): number {
  return (bb + 1) % n;
}

function seatIndex(state: HoldemGameState, playerId: string): number {
  const i = state.players.findIndex((p) => p.id === playerId);
  if (i < 0) {
    throw new Error(`Unknown player: ${playerId}`);
  }
  return i;
}

function nextActiveSeat(state: HoldemGameState, fromSeat: number): number {
  const n = state.players.length;
  for (let k = 1; k <= n; k++) {
    const idx = (fromSeat + k) % n;
    if (!state.players[idx].folded) {
      return idx;
    }
  }
  return fromSeat;
}

function firstPostFlopActor(state: HoldemGameState): number {
  const n = state.players.length;
  const start = (state.dealerIndex + 1) % n;
  for (let k = 0; k < n; k++) {
    const idx = (start + k) % n;
    if (!state.players[idx].folded) {
      return idx;
    }
  }
  return start;
}

function activePlayerCount(state: HoldemGameState): number {
  return state.players.filter((p) => !p.folded).length;
}

function syncScore(p: HoldemPlayerState): void {
  p.score = p.chips;
}

function allBetsMatched(state: HoldemGameState): boolean {
  const active = state.players.filter((p) => !p.folded);
  if (active.length === 0) {
    return true;
  }
  const m = state.currentBet;
  return active.every((p) => p.currentBet === m);
}

function cloneHoldemState(state: HoldemGameState): HoldemGameState {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      hand: [...p.hand],
    })),
    deck: [...state.deck],
    communityCards: [...state.communityCards],
    metadata: { ...state.metadata },
    responseNeeded: new Set(state.responseNeeded),
    history: [...state.history],
  };
}

function toCallAmount(state: HoldemGameState, p: HoldemPlayerState): number {
  return Math.max(0, state.currentBet - p.currentBet);
}

function resetStreetBets(state: HoldemGameState): void {
  for (const p of state.players) {
    p.currentBet = 0;
  }
  state.currentBet = 0;
}

function awardPotToWinners(
  state: HoldemGameState,
  winnerIds: string[],
): void {
  if (winnerIds.length === 0) {
    return;
  }
  const share = Math.floor(state.pot / winnerIds.length);
  const remainder = state.pot % winnerIds.length;
  for (let i = 0; i < winnerIds.length; i++) {
    const id = winnerIds[i];
    const add = share + (i < remainder ? 1 : 0);
    const pl = state.players.find((x) => x.id === id);
    if (pl) {
      pl.chips += add;
      syncScore(pl);
    }
  }
  state.pot = 0;
}

export class HoldemEngine implements GameEngine {
  initializeGame(players: Player[]): GameState {
    const n = players.length;
    if (n < 2 || n > 6) {
      throw new Error(`HoldemEngine: need 2–6 players, got ${n}`);
    }

    const dealerIndex = 0;
    const { sb: smallBlindIndex, bb: bigBlindIndex } = computeBlindIndices(n, dealerIndex);

    const holdemPlayers: HoldemPlayerState[] = players.map((p) => ({
      ...p,
      score: STARTING_CHIPS,
      chips: STARTING_CHIPS,
      status: 'active' as const,
      hand: [],
      currentBet: 0,
      folded: false,
    }));

    let deck = shuffleDeck(createDeck());

    for (const p of holdemPlayers) {
      for (let i = 0; i < 2; i++) {
        const next = dealCard(deck);
        deck = next.deck;
        p.hand.push(next.card);
      }
    }

    const sbPlayer = holdemPlayers[smallBlindIndex];
    const bbPlayer = holdemPlayers[bigBlindIndex];

    const sbPay = Math.min(SMALL_BLIND, sbPlayer.chips);
    const bbPay = Math.min(BIG_BLIND, bbPlayer.chips);

    sbPlayer.chips -= sbPay;
    sbPlayer.currentBet = sbPay;
    syncScore(sbPlayer);

    bbPlayer.chips -= bbPay;
    bbPlayer.currentBet = bbPay;
    syncScore(bbPlayer);

    const pot = sbPay + bbPay;
    const faceBet = Math.max(sbPlayer.currentBet, bbPlayer.currentBet);

    const responseNeeded = new Set(holdemPlayers.filter((p) => !p.folded).map((p) => p.id));

    const firstSeat = firstPreflopActorIndex(bigBlindIndex, n);

    const metadata: HoldemMetadata & Record<string, unknown> = {
      [HOLDEM_METADATA_KEY]: HOLDEM_GAME_KIND,
      smallBlindAmount: SMALL_BLIND,
      bigBlindAmount: BIG_BLIND,
      minRaiseIncrement: MIN_RAISE_INCREMENT,
    };

    const state: HoldemGameState = {
      id: newGameId(),
      players: holdemPlayers,
      currentPlayerId: holdemPlayers[firstSeat].id,
      phase: 'preflop',
      metadata,
      history: [],
      deck,
      communityCards: [],
      pot,
      dealerIndex,
      smallBlindIndex,
      bigBlindIndex,
      currentBet: faceBet,
      lastAggressorIndex: bigBlindIndex,
      responseNeeded,
    };

    console.log(
      `[Holdem] New hand ${state.id} | phase=preflop | players=${n} | dealer=${dealerIndex} SB=${smallBlindIndex} BB=${bigBlindIndex} | first actor seat=${firstSeat} (${state.currentPlayerId}) | pot=${pot}`,
    );

    return state;
  }

  getAvailableActions(state: GameState, playerId: string): PlayerAction[] {
    if (!isHoldemState(state)) {
      return [];
    }
    if (state.phase === 'showdown') {
      return [];
    }
    if (playerId !== state.currentPlayerId) {
      return [];
    }

    const st = state;
    const p = st.players[seatIndex(st, playerId)];
    if (p.folded) {
      return [];
    }

    const tc = toCallAmount(st, p);
    const ts = Date.now();
    const out: PlayerAction[] = [makeHoldemAction(HOLDEM_ACTION.FOLD, playerId, {}, ts)];

    if (tc === 0) {
      out.push(makeHoldemAction(HOLDEM_ACTION.CHECK, playerId, {}, ts));
      if (p.chips >= MIN_RAISE_INCREMENT) {
        out.push(
          makeHoldemAction(
            HOLDEM_ACTION.RAISE,
            playerId,
            { amount: MIN_RAISE_INCREMENT },
            ts,
          ),
        );
      }
    } else {
      if (p.chips >= tc) {
        out.push(makeHoldemAction(HOLDEM_ACTION.CALL, playerId, { amount: tc }, ts));
      }
      const minTotal = tc + MIN_RAISE_INCREMENT;
      if (p.chips >= minTotal) {
        out.push(
          makeHoldemAction(
            HOLDEM_ACTION.RAISE,
            playerId,
            { amount: minTotal },
            ts,
          ),
        );
      }
    }

    return out;
  }

  applyAction(state: GameState, action: PlayerAction): GameState {
    const st = assertHoldemState(state);
    if (st.phase === 'showdown') {
      throw new Error('HoldemEngine: hand is over');
    }
    if (action.playerId !== st.currentPlayerId) {
      throw new Error('HoldemEngine: wrong player to act');
    }

    const next = cloneHoldemState(st);
    const seat = seatIndex(next, action.playerId);
    const actor = next.players[seat];
    const timestamp = action.timestamp;

    const appendHistory = (): void => {
      next.history = [...next.history, { ...action, timestamp }];
    };

    const tc = toCallAmount(next, actor);

    switch (action.type) {
      case HOLDEM_ACTION.FOLD: {
        actor.folded = true;
        actor.status = 'folded';
        appendHistory();
        console.log(`[Holdem] ${action.playerId} folds`);
        break;
      }
      case HOLDEM_ACTION.CHECK: {
        if (tc !== 0) {
          throw new Error('HoldemEngine: cannot check facing a bet');
        }
        appendHistory();
        console.log(`[Holdem] ${action.playerId} checks`);
        break;
      }
      case HOLDEM_ACTION.CALL: {
        if (tc === 0) {
          throw new Error('HoldemEngine: nothing to call');
        }
        if (actor.chips < tc) {
          throw new Error('HoldemEngine: insufficient chips to call (MVP: no partial call)');
        }
        actor.chips -= tc;
        actor.currentBet += tc;
        next.pot += tc;
        syncScore(actor);
        appendHistory();
        console.log(`[Holdem] ${action.playerId} calls ${tc}`);
        break;
      }
      case HOLDEM_ACTION.RAISE: {
        const minTotalExtra = tc + MIN_RAISE_INCREMENT;
        const requested = (action.payload.amount as number | undefined) ?? minTotalExtra;
        if (requested < minTotalExtra && actor.chips >= minTotalExtra) {
          throw new Error('HoldemEngine: raise below minimum');
        }
        const pay = Math.min(requested, actor.chips);
        if (pay < minTotalExtra) {
          throw new Error('HoldemEngine: insufficient chips to raise');
        }
        actor.chips -= pay;
        actor.currentBet += pay;
        next.pot += pay;
        syncScore(actor);
        next.currentBet = Math.max(next.currentBet, actor.currentBet);
        next.lastAggressorIndex = seat;
        next.responseNeeded = new Set(
          next.players.filter((p) => !p.folded && p.id !== actor.id).map((p) => p.id),
        );
        appendHistory();
        console.log(`[Holdem] ${action.playerId} raises (adds ${pay}, face=${next.currentBet})`);
        break;
      }
      default:
        throw new Error(`HoldemEngine: unknown action ${action.type}`);
    }

    if (action.type !== HOLDEM_ACTION.RAISE) {
      next.responseNeeded.delete(action.playerId);
    }

    const alive = activePlayerCount(next);
    if (alive <= 1) {
      const winner = next.players.find((p) => !p.folded);
      if (winner) {
        winner.chips += next.pot;
        syncScore(winner);
        console.log(`[Holdem] Winner by fold: ${winner.id} (+${next.pot})`);
        next.pot = 0;
        next.metadata = {
          ...next.metadata,
          foldWinnerId: winner.id,
        };
      }
      next.phase = 'showdown';
      next.currentPlayerId = '';
      console.log(`[Holdem] Phase -> showdown (fold win)`);
      return next;
    }

    if (
      next.responseNeeded.size === 0 &&
      allBetsMatched(next) &&
      action.type !== HOLDEM_ACTION.RAISE
    ) {
      return advancePhase(next);
    }

    const nextSeat = nextActiveSeat(next, seat);
    next.currentPlayerId = next.players[nextSeat].id;
    return next;
  }

  isGameOver(state: GameState): boolean {
    if (!isHoldemState(state)) {
      return false;
    }
    if (state.phase === 'showdown') {
      return true;
    }
    return activePlayerCount(state) <= 1;
  }

  getResult(state: GameState): GameResult | null {
    if (!isHoldemState(state) || !this.isGameOver(state)) {
      return null;
    }

    const st = state;

    if (st.metadata.foldWinnerId) {
      const w = st.metadata.foldWinnerId;
      return {
        winners: [w],
        rankings: { [w]: 1 },
        summary: `Winner by fold: ${w}`,
      };
    }

    if (st.phase !== 'showdown') {
      return null;
    }

    const contenders = st.players.filter((p) => !p.folded);
    const strengths = contenders.map((p) => ({
      id: p.id,
      strength: evaluateHoldemHand(p.hand, st.communityCards),
    }));

    let best = strengths[0].strength;
    for (const s of strengths) {
      if (compareHandStrength(s.strength, best) > 0) {
        best = s.strength;
      }
    }

    const winners = strengths
      .filter((s) => compareHandStrength(s.strength, best) === 0)
      .map((s) => s.id);

    const rankings: Record<string, number> = {};
    strengths
      .slice()
      .sort((a, b) => compareHandStrength(b.strength, a.strength))
      .forEach((row, i) => {
        rankings[row.id] = i + 1;
      });

    console.log(`[Holdem] Showdown winners: ${winners.join(', ')} | pot was distributed in engine`);

    return {
      winners,
      rankings,
      summary: `Showdown: ${winners.join(', ')}`,
    };
  }
}

function advancePhase(state: HoldemGameState): HoldemGameState {
  const next = cloneHoldemState(state);

  switch (next.phase) {
    case 'preflop': {
      resetStreetBets(next);
      for (let i = 0; i < 3; i++) {
        const d = dealCard(next.deck);
        next.deck = d.deck;
        next.communityCards.push(d.card);
      }
      next.phase = 'flop';
      next.responseNeeded = new Set(next.players.filter((p) => !p.folded).map((p) => p.id));
      const first = firstPostFlopActor(next);
      next.currentPlayerId = next.players[first].id;
      console.log(`[Holdem] Phase -> flop | board=${formatBoard(next.communityCards)}`);
      return next;
    }
    case 'flop': {
      resetStreetBets(next);
      const d = dealCard(next.deck);
      next.deck = d.deck;
      next.communityCards.push(d.card);
      next.phase = 'turn';
      next.responseNeeded = new Set(next.players.filter((p) => !p.folded).map((p) => p.id));
      const first = firstPostFlopActor(next);
      next.currentPlayerId = next.players[first].id;
      console.log(`[Holdem] Phase -> turn | board=${formatBoard(next.communityCards)}`);
      return next;
    }
    case 'turn': {
      resetStreetBets(next);
      const d = dealCard(next.deck);
      next.deck = d.deck;
      next.communityCards.push(d.card);
      next.phase = 'river';
      next.responseNeeded = new Set(next.players.filter((p) => !p.folded).map((p) => p.id));
      const first = firstPostFlopActor(next);
      next.currentPlayerId = next.players[first].id;
      console.log(`[Holdem] Phase -> river | board=${formatBoard(next.communityCards)}`);
      return next;
    }
    case 'river': {
      resetStreetBets(next);
      next.phase = 'showdown';
      next.currentPlayerId = '';
      next.responseNeeded = new Set();

      const contenders = next.players.filter((p) => !p.folded);
      const strengths = contenders.map((p) => ({
        id: p.id,
        strength: evaluateHoldemHand(p.hand, next.communityCards),
      }));

      let best = strengths[0].strength;
      for (const s of strengths) {
        if (compareHandStrength(s.strength, best) > 0) {
          best = s.strength;
        }
      }

      const winners = strengths
        .filter((s) => compareHandStrength(s.strength, best) === 0)
        .map((s) => s.id);

      awardPotToWinners(next, winners);
      console.log(
        `[Holdem] Phase -> showdown | board=${formatBoard(next.communityCards)} | winners=${winners.join(', ')}`,
      );
      return next;
    }
    default:
      return next;
  }
}

function formatBoard(cards: { rank: number; suit: string }[]): string {
  return cards.map((c) => `${c.rank}${c.suit}`).join(' ');
}
