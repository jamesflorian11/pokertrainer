import { openDatabaseAsync } from 'expo-sqlite';

type AppDatabase = Awaited<ReturnType<typeof openDatabaseAsync>>;

let database: AppDatabase | null = null;

export async function getDatabase(): Promise<AppDatabase> {
  if (!database) {
    database = await openDatabaseAsync('skill_trainer.db');
  }
  return database;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      game_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      payload TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
  `);
}
