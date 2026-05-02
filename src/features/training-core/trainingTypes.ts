/**
 * Training / coaching domain — game-agnostic analysis hooks (no poker rules).
 */

import type { GameState, PlayerAction } from '@/games/shared';

/** Severity used for both mistakes and feedback. */
export type TrainingSeverity = 'low' | 'medium' | 'high';

/**
 * Examples: `action_taken`, `mistake_detected`, `hint_shown`, `feedback_generated`.
 */
export interface TrainingEvent {
  id: string;
  type: string;
  playerId: string;
  gameStateSnapshot: Partial<GameState>;
  action: PlayerAction;
  timestamp: number;
}

export interface Mistake {
  id: string;
  /** Coaching topic, e.g. "pot_odds", "position" — game-specific strings allowed. */
  concept: string;
  severity: TrainingSeverity;
  description: string;
  expectedAction?: PlayerAction;
  actualAction: PlayerAction;
}

export interface Feedback {
  message: string;
  suggestion: string;
  relatedConcept: string;
  severity: TrainingSeverity;
}

export interface TrainingAnalyzer {
  analyzeAction(
    state: GameState,
    action: PlayerAction,
  ): {
    mistakes: Mistake[];
    feedback: Feedback[];
  };
}
