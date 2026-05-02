/**
 * Coordinates local SQLite changes with the backend when online.
 * Implementation deferred — keep API stable for outbox / replay later.
 */

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncCoordinator {
  /** Flush pending local records to the server when connectivity allows */
  flushPending(): Promise<void>;
  getStatus(): SyncStatus;
}

export function createSyncCoordinatorStub(): SyncCoordinator {
  let status: SyncStatus = 'idle';
  return {
    async flushPending() {
      status = 'syncing';
      status = 'idle';
    },
    getStatus() {
      return status;
    },
  };
}
