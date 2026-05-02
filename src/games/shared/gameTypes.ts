/**
 * Shared contracts for any skill-based game engine (not poker-specific).
 */

export type GameStatus = 'idle' | 'running' | 'paused' | 'finished' | string;

export interface GameState {
  status: GameStatus;
  phase: string | number;
  metadata: Record<string, unknown>;
}

export interface Player {
  id: string;
  displayName: string;
  seatIndex?: number;
  metadata?: Record<string, unknown>;
}

export interface PlayerAction {
  playerId: string;
  type: string;
  payload?: unknown;
  timestamp: number;
}

export interface GameResult {
  winnerIds: string[];
  scores?: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface GameEngine {
  reset(seed?: string): void;
  applyAction(action: PlayerAction): GameState;
  getState(): GameState;
  /** Optional hook when a terminal state is reached */
  getResult?(): GameResult | null;
}
