import { getDatabase } from '@/services/storage/db';

type SessionSqlRow = {
  id: string;
  game_id: string;
  started_at: number;
  payload: string;
  synced: number;
};

export type SessionRow = {
  id: string;
  gameId: string;
  startedAt: number;
  payload: Record<string, unknown>;
  synced: boolean;
};

type SessionInput = Omit<SessionRow, 'synced'> & { synced?: boolean };

export async function saveSession(input: SessionInput): Promise<void> {
  const db = await getDatabase();
  const synced = input.synced ?? false;
  await db.runAsync(
    `INSERT OR REPLACE INTO sessions (id, game_id, started_at, payload, synced)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.id,
      input.gameId,
      input.startedAt,
      JSON.stringify(input.payload),
      synced ? 1 : 0,
    ],
  );
}

export async function getSessions(): Promise<SessionRow[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionSqlRow>(
    `SELECT id, game_id, started_at, payload, synced FROM sessions
      ORDER BY started_at DESC`,
  );

  return rows.map((r: SessionSqlRow) => ({
    id: r.id,
    gameId: r.game_id,
    startedAt: r.started_at,
    payload: JSON.parse(r.payload) as Record<string, unknown>,
    synced: r.synced === 1,
  }));
}
