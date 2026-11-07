export interface PerformanceGhost {
  timestamp: number;
  problemId: string;
  latencyMs: number;
  accuracy: number;
}

export class GhostDB {
  private dbName: string = 'MathFluencyLabDB';
  private dbVersion: number = 1;
  private db: IDBDatabase | null = null;
  private inMemoryFallback: PerformanceGhost[] = [];

  public async init(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return;
    }
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('ghosts')) {
            const store = db.createObjectStore('ghosts', { keyPath: 'id', autoIncrement: true });
            store.createIndex('problemId', 'problemId', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve();
        };

        request.onerror = () => {
          // Graceful fallback to in-memory cache
          resolve();
        };
      } catch (e) {
        resolve();
      }
    });
  }

  public async saveGhost(ghost: PerformanceGhost): Promise<void> {
    this.inMemoryFallback.push(ghost);
    if (!this.db) {
      await this.init();
    }
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('ghosts', 'readwrite');
        const store = tx.objectStore('ghosts');
        const req = store.add(ghost);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  }

  public async getPersonalBest(problemId: string): Promise<PerformanceGhost | null> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      const memMatches = this.inMemoryFallback
        .filter(r => r.problemId === problemId && r.accuracy === 1)
        .sort((a, b) => a.latencyMs - b.latencyMs);
      return memMatches[0] || null;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('ghosts', 'readonly');
        const store = tx.objectStore('ghosts');
        const index = store.index('problemId');
        const request = index.getAll(IDBKeyRange.only(problemId));

        request.onsuccess = () => {
          const results: PerformanceGhost[] = request.result || [];
          const best = results
            .filter(r => r.accuracy === 1)
            .sort((a, b) => a.latencyMs - b.latencyMs)[0];
          resolve(best || null);
        };

        request.onerror = () => {
          const memMatches = this.inMemoryFallback
            .filter(r => r.problemId === problemId && r.accuracy === 1)
            .sort((a, b) => a.latencyMs - b.latencyMs);
          resolve(memMatches[0] || null);
        };
      } catch (e) {
        const memMatches = this.inMemoryFallback
          .filter(r => r.problemId === problemId && r.accuracy === 1)
          .sort((a, b) => a.latencyMs - b.latencyMs);
        resolve(memMatches[0] || null);
      }
    });
  }
}
