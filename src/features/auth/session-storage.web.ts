import type { SessionStorage, StoredCredential } from './session-controller';

/** Browser sessions remain in memory; credentials never enter Web Storage. */
export function createSessionStorage(): SessionStorage {
  let credential: StoredCredential | null = null;
  return {
    async read() { return credential; },
    async write(value) { credential = value; },
    async clear() { credential = null; },
  };
}
