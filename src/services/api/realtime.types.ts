/**
 * Future WebSocket client contract — transport not wired yet.
 */

export type RealtimeMessage<TPayload = unknown> = {
  type: string;
  payload: TPayload;
  sentAt: number;
};

export type RealtimeHandler = (message: RealtimeMessage) => void;

export interface RealtimeClient {
  connect(url: string, token?: string | null): Promise<void>;
  disconnect(): void;
  send(message: Omit<RealtimeMessage, 'sentAt'>): void;
  subscribe(handler: RealtimeHandler): () => void;
}
