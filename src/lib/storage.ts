/**
 * localStorage that never throws: SSR, Safari private mode, blocked site data
 * and quota errors all degrade gracefully. Every write also lands in an
 * in-memory copy, so the UI keeps working for this page session even when
 * nothing can be persisted. Writes notify subscribers in this tab; the
 * `storage` event covers other tabs.
 */

type Listener = () => void;
const listeners = new Set<Listener>();
/** Session fallback — authoritative whenever localStorage is unavailable. */
const memory = new Map<string, string>();

function store(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notify() {
  for (const listener of listeners) listener();
}

export function readItem(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string | null): void {
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    const s = store();
    if (value === null) s?.removeItem(key);
    else s?.setItem(key, value);
  } catch {
    // Quota or security error: the in-memory copy keeps the UI consistent.
  } finally {
    notify();
  }
}

export function removeByPrefix(prefix: string): void {
  for (const key of [...memory.keys()]) if (key.startsWith(prefix)) memory.delete(key);
  try {
    const s = store();
    if (s) {
      const keys: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const key = s.key(i);
        if (key?.startsWith(prefix)) keys.push(key);
      }
      keys.forEach((key) => s.removeItem(key));
    }
  } catch {
    // ignore
  } finally {
    notify();
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    // Another tab changed persisted data: drop our copy so the new value wins.
    if (e.key === null) memory.clear();
    else memory.delete(e.key);
    listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

/** Test helper: forget the in-memory copy. */
export function resetStorageForTests() {
  memory.clear();
}
