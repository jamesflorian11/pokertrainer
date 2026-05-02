import type {
  GameEngine,
  GameResult,
  GameState,
  Player,
  PlayerAction,
} from '@/games/shared';
import type { Feedback, Mistake, TrainingAnalyzer, TrainingEvent } from '@/features/training-core';

function snapshotForTraining(state: GameState): Partial<GameState> {
  return {
    id: state.id,
    phase: state.phase,
    currentPlayerId: state.currentPlayerId,
    players: state.players,
    metadata: state.metadata,
    history: state.history,
  };
}

/**
 * Orchestrates a {@link GameEngine}, optional {@link TrainingAnalyzer}, and holds
 * state for persistence / UI. Does not implement game rules — engines own legality.
 */
export class GameSession {
  private state: GameState | null = null;
  private trainingEvents: TrainingEvent[] = [];
  private cachedResult: GameResult | null = null;
  private trainingEventSeq = 0;

  constructor(
    private readonly engine: GameEngine,
    private readonly analyzer?: TrainingAnalyzer,
  ) {}

  private nextTrainingEventId(): string {
    this.trainingEventSeq += 1;
    return `te_${Date.now()}_${this.trainingEventSeq}`;
  }

  startGame(players: Player[]): void {
    this.trainingEvents = [];
    this.cachedResult = null;
    this.trainingEventSeq = 0;
    this.state = this.engine.initializeGame(players);
  }

  applyPlayerAction(action: PlayerAction): void {
    if (this.state === null) {
      throw new Error('GameSession: startGame must be called before applyPlayerAction');
    }

    const stateBefore = this.state;
    const analysis =
      this.analyzer?.analyzeAction(stateBefore, action) ?? { mistakes: [], feedback: [] };

    this.appendTrainingFromAnalysis(stateBefore, action, analysis);

    this.state = this.engine.applyAction(stateBefore, action);

    if (this.engine.isGameOver(this.state)) {
      this.cachedResult = this.engine.getResult(this.state);
    }
  }

  getState(): GameState | null {
    return this.state;
  }

  /** Canonical action log — delegated from {@link GameState.history}. */
  getHistory(): PlayerAction[] {
    return this.state?.history ?? [];
  }

  getTrainingEvents(): readonly TrainingEvent[] {
    return this.trainingEvents;
  }

  getResult(): GameResult | null {
    return this.cachedResult;
  }

  private appendTrainingFromAnalysis(
    stateBefore: GameState,
    action: PlayerAction,
    analysis: { mistakes: Mistake[]; feedback: Feedback[] },
  ): void {
    const ts = Date.now();

    this.trainingEvents.push({
      id: this.nextTrainingEventId(),
      type: 'action_taken',
      playerId: action.playerId,
      gameStateSnapshot: snapshotForTraining(stateBefore),
      action,
      timestamp: ts,
    });

    for (const mistake of analysis.mistakes) {
      this.trainingEvents.push({
        id: this.nextTrainingEventId(),
        type: 'mistake_detected',
        playerId: mistake.actualAction.playerId,
        gameStateSnapshot: snapshotForTraining(stateBefore),
        action: mistake.actualAction,
        timestamp: ts,
      });
    }

    for (const _fb of analysis.feedback) {
      this.trainingEvents.push({
        id: this.nextTrainingEventId(),
        type: 'hint_shown',
        playerId: action.playerId,
        gameStateSnapshot: snapshotForTraining(stateBefore),
        action,
        timestamp: ts,
      });
    }
  }
}
