import { DHAKA_TZ } from './constants';
import { dhakaDayDiff, toMs, DAY, HOUR, MINUTE } from './time';
import type { Address, EtaWindow, Money, PaymentMethod } from './types';

/*
 * All user-facing dates, times and money go through here (R8).
 * Strings are assembled from `formatToParts` so ICU differences between
 * Node and browsers (e.g. U+202F before AM/PM, "Sept") can't leak into the UI.
 */

const dateFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: DHAKA_TZ,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const longWeekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: DHAKA_TZ, weekday: 'long' });
const timeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: DHAKA_TZ,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

type Parts = Partial<Record<Intl.DateTimeFormatPartTypes, string>>;

function partsOf(fmt: Intl.DateTimeFormat, ms: number): Parts {
  const out: Parts = {};
  for (const part of fmt.formatToParts(ms)) out[part.type] = part.value;
  return out;
}

function dateParts(ms: number) {
  const p = partsOf(dateFmt, ms);
  return { weekday: p.weekday ?? '', day: p.day ?? '', month: p.month ?? '' };
}

/** "Thu, 24 Sep" */
export function formatDate(ms: number): string {
  const { weekday, day, month } = dateParts(ms);
  return `${weekday}, ${day} ${month}`;
}

/** "Thursday" */
export function formatWeekdayLong(ms: number): string {
  return longWeekdayFmt.format(ms);
}

/** "2:14 PM" — or "6 PM" with `compact` when minutes are :00. */
export function formatTime(ms: number, { compact = false } = {}): string {
  const p = partsOf(timeFmt, ms);
  const period = (p.dayPeriod ?? '').toUpperCase();
  if (compact && p.minute === '00') return `${p.hour} ${period}`;
  return `${p.hour}:${p.minute} ${period}`;
}

export function relativeDayName(
  ms: number,
  now: number,
): 'Today' | 'Tomorrow' | 'Yesterday' | null {
  const diff = dhakaDayDiff(now, ms);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return null;
}

/** "Today" | "Tomorrow" | "Yesterday" | "Thu, 24 Sep" */
export function formatDayLabel(ms: number, now: number): string {
  return relativeDayName(ms, now) ?? formatDate(ms);
}

/** Mid-sentence form: "today" | "tomorrow" | "yesterday" | "Sat, 26 Sep" */
export function formatDayPhrase(ms: number, now: number): string {
  return relativeDayName(ms, now)?.toLowerCase() ?? formatDate(ms);
}

/** "Tomorrow, Thu 24 Sep" | "Sat, 26 Sep" */
export function formatDayWithDate(ms: number, now: number): string {
  const rel = relativeDayName(ms, now);
  if (!rel) return formatDate(ms);
  const { weekday, day, month } = dateParts(ms);
  return `${rel}, ${weekday} ${day} ${month}`;
}

/** "Today, 12:14 PM" | "Sat, 19 Sep, 3:40 PM" */
export function formatDateTime(ms: number, now: number): string {
  return `${formatDayLabel(ms, now)}, ${formatTime(ms)}`;
}

/** Mid-sentence form: "today at 10:56 AM" | "Fri, 25 Sep at 12:43 PM" */
export function formatDateTimePhrase(ms: number, now: number): string {
  return `${formatDayPhrase(ms, now)} at ${formatTime(ms)}`;
}

/**
 * Delivery window.
 * Same day   → { value: "Tomorrow, Thu 24 Sep", window: "10 AM – 6 PM" }
 * Multi-day  → { value: "Fri 25 – Sun 27 Sep" } or "Wed 30 Sep – Fri 2 Oct"
 */
export function formatWindow(win: EtaWindow, now: number): { value: string; window?: string } {
  const start = toMs(win.start);
  const end = toMs(win.end);
  if (dhakaDayDiff(start, end) === 0) {
    return {
      value: formatDayWithDate(end, now),
      window: `${formatTime(start, { compact: true })} – ${formatTime(end, { compact: true })}`,
    };
  }
  const a = dateParts(start);
  const b = dateParts(end);
  const value =
    a.month === b.month
      ? `${a.weekday} ${a.day} – ${b.weekday} ${b.day} ${b.month}`
      : `${a.weekday} ${a.day} ${a.month} – ${b.weekday} ${b.day} ${b.month}`;
  return { value };
}

/** "just now" | "12 min ago" | "3 hours ago" | "2 days ago" */
export function formatAgo(ms: number, now: number): string {
  const delta = Math.max(0, now - ms);
  if (delta < MINUTE) return 'just now';
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)} min ago`;
  if (delta < DAY) return plural(Math.floor(delta / HOUR), 'hour') + ' ago';
  return plural(Math.floor(delta / DAY), 'day') + ' ago';
}

/** "৳3,450" */
export function formatMoney(money: Money): string {
  const sign = money.amount < 0 ? '−' : '';
  return `${sign}৳${numberFmt.format(Math.abs(money.amount))}`;
}

export function formatPayment(payment: PaymentMethod): string {
  switch (payment.type) {
    case 'card':
      return `Card •••• ${payment.last4}`;
    case 'mobile_wallet':
      return `Mobile wallet •••• ${payment.last2}`;
    case 'cod':
      return 'Cash on delivery';
  }
}

/** "+8801712345621" → "+880 17•• ••••21" */
export function maskPhone(e164: string): string {
  const local = e164.replace(/^\+880/, '');
  return `+880 ${local.slice(0, 2)}•• ••••${local.slice(-2)}`;
}

/** "House 12, Road 5" → "House ••, Road 5, Dhanmondi, Dhaka" */
export function maskAddress(address: Address): string {
  const line1 = address.line1.replace(/^(House|Flat|Apt|Holding)\s+[^,]+/i, '$1 ••');
  return `${line1}, ${address.area}, ${address.city}`;
}

export function plural(count: number, word: string, pluralWord = `${word}s`): string {
  return `${count} ${count === 1 ? word : pluralWord}`;
}
