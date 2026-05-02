/**
 * Future WebSocket server contract — no socket library wired yet.
 */

export type ServerRealtimeMessage<TPayload = unknown> = {
  type: string;
  payload: TPayload;
  sentAt: number;
};

export type RealtimeConnectionContext = {
  userId: string | null;
  connectionId: string;
};

export interface RealtimeGateway {
  broadcast(roomId: string, message: ServerRealtimeMessage): void;
  handleConnection(ctx: RealtimeConnectionContext): void;
}
