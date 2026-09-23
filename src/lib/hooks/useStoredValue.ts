'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { readItem, subscribe } from '@/lib/storage';

/**
 * The raw stored string for `key` (null when absent or on the server).
 * Strings compare by value, so the snapshot is stable without extra caching.
 */
export function useStoredValue(key: string): string | null {
  const getSnapshot = useCallback(() => readItem(key), [key]);
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
