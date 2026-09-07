type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 30_000) return;
  lastSweep = now;
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export function ttlGet<T>(key: string): T | undefined {
  const now = Date.now();
  sweep(now);
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function ttlSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function ttlDelete(key: string): void {
  store.delete(key);
}

export function ttlDeletePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Read-through cache. `loader` runs on miss. */
export async function ttlCached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = ttlGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await loader();
  ttlSet(key, value, ttlMs);
  return value;
}
