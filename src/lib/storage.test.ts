import { afterEach, describe, expect, it, vi } from 'vitest';
import { readItem, removeByPrefix, subscribe, writeItem } from './storage';

describe('storage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps working in memory when localStorage throws (blocked site data)', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    writeItem('k:1', 'value');
    expect(readItem('k:1')).toBe('value');
    expect(listener).toHaveBeenCalledTimes(1);
    removeByPrefix('k:');
    expect(readItem('k:1')).toBeNull();
    unsubscribe();
  });

  it('keeps working when setItem hits the quota', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    writeItem('k:2', 'value');
    expect(readItem('k:2')).toBe('value');
  });

  it('persists normally when storage works', () => {
    writeItem('k:3', 'value');
    expect(window.localStorage.getItem('k:3')).toBe('value');
  });
});
