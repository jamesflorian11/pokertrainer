/**
 * Shared contracts for any skill-based turn-based game engine (not poker-specific).
 *
 * Immutability: `applyAction` must return a new `GameState` and append the executed
 * `PlayerAction` to `history` so sessions, replay, and training see a single source of truth.
 */

export type PlayerStatus =
  | 'active'
  | 'folded'
  | 'eliminated'
  | 'spectating';

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerId: string;
  /** Game-specific phase label (each game may document its own phase strings). */
  phase: string;
  metadata: Record<string, unknown>;
  history: PlayerAction[];
}

/**
 * `score` is a generic resource (e.g. chip count in betting games, points elsewhere).
 */
export interface Player {
  id: string;
  name: string;
  score: number;
  status: PlayerStatus;
}

export interface PlayerAction {
  type: string;
  playerId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface GameResult {
  winners: string[];
  /** Optional per-player placement (e.g. playerId -> rank, lower is better). */
  rankings?: Record<string, number>;
  summary: string | Record<string, unknown>;
}

export interface GameEngine {
  initializeGame(players: Player[]): GameState;
  getAvailableActions(state: GameState, playerId: string): PlayerAction[];
  applyAction(state: GameState, action: PlayerAction): GameState;
  isGameOver(state: GameState): boolean;
  getResult(state: GameState): GameResult | null;
}
