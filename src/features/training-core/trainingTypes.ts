/**
 * Training / coaching domain — game-agnostic event stream and analysis hooks.
 */

export interface TrainingEvent {
  id: string;
  type: string;
  timestamp: number;
  context: Record<string, unknown>;
}

export type MistakeSeverity = 'info' | 'low' | 'medium' | 'high' | string;

export interface Mistake {
  id: string;
  severity: MistakeSeverity;
  category: string;
  details: string;
  relatedEventId?: string;
}

export interface Feedback {
  id: string;
  message: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface TrainingAnalyzer {
  analyze(events: TrainingEvent[]): Mistake[];
  buildFeedback?(mistakes: Mistake[]): Feedback;
}
