// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { atDhaka, dhakaDayDiff, dhakaMinutesOfDay, isWithinDhakaHours } from './time';

const utc = (iso: string) => Date.parse(iso);

describe('Dhaka calendar math', () => {
  it('runs in a non-Dhaka host zone so formatters must be explicit', () => {
    expect(new Date(utc('2026-09-23T08:00:00Z')).getTimezoneOffset()).not.toBe(-360);
  });

  it('counts calendar days across Dhaka midnight (18:00 UTC)', () => {
    expect(dhakaDayDiff(utc('2026-09-23T17:59:00Z'), utc('2026-09-23T18:01:00Z'))).toBe(1);
    expect(dhakaDayDiff(utc('2026-09-23T00:00:00Z'), utc('2026-09-23T17:59:00Z'))).toBe(0);
  });

  it('handles month and year ends', () => {
    expect(dhakaDayDiff(utc('2026-09-30T10:00:00Z'), utc('2026-10-01T10:00:00Z'))).toBe(1);
    expect(dhakaDayDiff(utc('2026-12-31T12:00:00Z'), utc('2027-01-01T12:00:00Z'))).toBe(1);
  });

  it('places HH:mm on a Dhaka day relative to now', () => {
    const now = utc('2026-09-23T08:00:00Z'); // 2:00 PM Dhaka
    expect(new Date(atDhaka(0, '10:00', now)).toISOString()).toBe('2026-09-23T04:00:00.000Z');
    expect(new Date(atDhaka(1, '18:00', now)).toISOString()).toBe('2026-09-24T12:00:00.000Z');
    // 11:30 PM Dhaka is already the next UTC-shifted day boundary
    const late = utc('2026-09-23T17:30:00Z');
    expect(new Date(atDhaka(0, '10:00', late)).toISOString()).toBe('2026-09-23T04:00:00.000Z');
  });

  it('checks support hours in Dhaka time', () => {
    expect(dhakaMinutesOfDay(utc('2026-09-23T03:00:00Z'))).toBe(9 * 60);
    expect(isWithinDhakaHours(utc('2026-09-23T02:59:00Z'), '09:00', '21:00')).toBe(false);
    expect(isWithinDhakaHours(utc('2026-09-23T03:00:00Z'), '09:00', '21:00')).toBe(true);
    expect(isWithinDhakaHours(utc('2026-09-23T14:59:00Z'), '09:00', '21:00')).toBe(true);
    expect(isWithinDhakaHours(utc('2026-09-23T15:00:00Z'), '09:00', '21:00')).toBe(false);
  });
});
