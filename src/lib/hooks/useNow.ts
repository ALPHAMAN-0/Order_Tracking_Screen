'use client';

import { useSyncExternalStore } from 'react';
import { clock } from '@/lib/clock';

const TICK_MS = 60_000;

let snapshot: number | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  snapshot = clock.now();
  listeners.forEach((l) => l());
}

function onVisibility() {
  if (document.visibilityState === 'visible') tick();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    // The cached time may be stale if nothing was subscribed for a while
    // (e.g. after client-side navigation); React re-reads the snapshot.
    snapshot = clock.now();
    timer = setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', onVisibility);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}

function getSnapshot(): number {
  if (snapshot === null) snapshot = clock.now();
  return snapshot;
}

const getServerSnapshot = (): null => null;

/**
 * Current time, refreshed every minute and whenever the tab becomes visible.
 * `null` during SSR and hydration, so no time-dependent text is ever rendered
 * on the server (Vercel runs in UTC) — which rules out hydration mismatches.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Test helper: forget the cached time so the next read uses `clock.now()`. */
export function resetNowForTests() {
  snapshot = null;
}
