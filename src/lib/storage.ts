/**
 * localStorage that never throws: SSR, Safari private mode, blocked site data
 * and quota errors all degrade to "nothing stored". Writes notify subscribers
 * in this tab; the `storage` event covers other tabs.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

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
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string | null): void {
  try {
    const s = store();
    if (!s) return;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    // Quota or security errors: keep the in-memory UI working without persistence.
  } finally {
    notify();
  }
}

export function removeByPrefix(prefix: string): void {
  try {
    const s = store();
    if (!s) return;
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    keys.forEach((key) => s.removeItem(key));
  } catch {
    // ignore
  } finally {
    notify();
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = () => listener();
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}
