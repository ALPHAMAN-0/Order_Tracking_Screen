/**
 * Dhaka calendar math. Asia/Dhaka is a fixed UTC+6 zone (no DST since 2009),
 * so day boundaries can be computed arithmetically and stay identical on the
 * server (UTC), in CI and in any evaluator's browser.
 */

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const DHAKA_OFFSET_MS = 6 * HOUR;

export const toMs = (iso: string): number => Date.parse(iso);
export const toIso = (ms: number): string => new Date(ms).toISOString();

/** Days since the epoch, counted in Dhaka local time. */
export function dhakaDayIndex(ms: number): number {
  return Math.floor((ms + DHAKA_OFFSET_MS) / DAY);
}

/** Calendar-day difference in Dhaka (`to` minus `from`). */
export function dhakaDayDiff(fromMs: number, toMs: number): number {
  return dhakaDayIndex(toMs) - dhakaDayIndex(fromMs);
}

/** Minutes after local midnight, e.g. "09:30" → 570. */
export function parseHHmm(hhmm: string): number {
  const [h = '0', m = '0'] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
}

/** The instant `hh:mm` Dhaka time on the Dhaka day `dayOffset` days from `now`. */
export function atDhaka(dayOffset: number, hhmm: string, now: number): number {
  const dhakaMidnightUtc = dhakaDayIndex(now) * DAY - DHAKA_OFFSET_MS;
  return dhakaMidnightUtc + dayOffset * DAY + parseHHmm(hhmm) * MINUTE;
}

/** Minutes after Dhaka midnight for an instant. */
export function dhakaMinutesOfDay(ms: number): number {
  const local = ms + DHAKA_OFFSET_MS;
  return Math.floor((((local % DAY) + DAY) % DAY) / MINUTE);
}

/** True when `ms` falls in [open, close) Dhaka time, e.g. support hours. */
export function isWithinDhakaHours(ms: number, open: string, close: string): boolean {
  const minutes = dhakaMinutesOfDay(ms);
  return minutes >= parseHHmm(open) && minutes < parseHHmm(close);
}
