// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  formatAgo,
  formatDate,
  formatDateTime,
  formatDayWithDate,
  formatMoney,
  formatPayment,
  formatTime,
  formatWindow,
  maskAddress,
  maskPhone,
} from './format';

const utc = (iso: string) => Date.parse(iso);
const NOW = utc('2026-09-23T08:00:00Z'); // Wed 23 Sep, 2:00 PM Dhaka

describe('formatters (always Asia/Dhaka, host zone is New York)', () => {
  it('formats dates and times', () => {
    expect(formatDate(utc('2026-09-24T04:00:00Z'))).toBe('Thu, 24 Sep');
    expect(formatTime(utc('2026-09-23T08:14:00Z'))).toBe('2:14 PM');
    expect(formatTime(utc('2026-09-23T12:00:00Z'), { compact: true })).toBe('6 PM');
    expect(formatTime(utc('2026-09-23T12:30:00Z'), { compact: true })).toBe('6:30 PM');
  });

  it('never emits narrow no-break spaces', () => {
    expect(formatTime(utc('2026-09-23T08:14:00Z'))).not.toMatch(/ /);
  });

  it('uses relative day names in Dhaka', () => {
    expect(formatDayWithDate(utc('2026-09-24T04:00:00Z'), NOW)).toBe('Tomorrow, Thu 24 Sep');
    expect(formatDateTime(utc('2026-09-23T06:14:00Z'), NOW)).toBe('Today, 12:14 PM');
    expect(formatDateTime(utc('2026-09-22T09:40:00Z'), NOW)).toBe('Yesterday, 3:40 PM');
    // 1:00 AM Dhaka on the 24th is still "Tomorrow" even though it's the 23rd in UTC
    expect(formatDayWithDate(utc('2026-09-23T19:00:00Z'), NOW)).toBe('Tomorrow, Thu 24 Sep');
  });

  it('formats delivery windows', () => {
    expect(
      formatWindow({ start: '2026-09-24T04:00:00Z', end: '2026-09-24T12:00:00Z' }, NOW),
    ).toEqual({
      value: 'Tomorrow, Thu 24 Sep',
      window: '10 AM – 6 PM',
    });
    expect(
      formatWindow({ start: '2026-09-25T04:00:00Z', end: '2026-09-27T14:00:00Z' }, NOW),
    ).toEqual({
      value: 'Fri 25 – Sun 27 Sep',
    });
    expect(
      formatWindow({ start: '2026-09-30T04:00:00Z', end: '2026-10-02T14:00:00Z' }, NOW),
    ).toEqual({
      value: 'Wed 30 Sep – Fri 2 Oct',
    });
  });

  it('formats relative ages', () => {
    expect(formatAgo(NOW - 30_000, NOW)).toBe('just now');
    expect(formatAgo(NOW - 12 * 60_000, NOW)).toBe('12 min ago');
    expect(formatAgo(NOW - 3 * 3_600_000, NOW)).toBe('3 hours ago');
    expect(formatAgo(NOW - 26 * 3_600_000, NOW)).toBe('1 day ago');
  });

  it('formats money, payment and masks personal data', () => {
    expect(formatMoney({ amount: 3450, currency: 'BDT' })).toBe('৳3,450');
    expect(formatMoney({ amount: -300, currency: 'BDT' })).toBe('−৳300');
    expect(formatPayment({ type: 'card', last4: '4242' })).toBe('Card •••• 4242');
    expect(formatPayment({ type: 'cod' })).toBe('Cash on delivery');
    expect(maskPhone('+8801712345621')).toBe('+880 17•• ••••21');
    expect(
      maskAddress({
        recipient: 'A',
        phone: '',
        line1: 'House 27, Road 5',
        area: 'Dhanmondi',
        city: 'Dhaka',
        postcode: '1205',
      }),
    ).toBe('House ••, Road 5, Dhanmondi, Dhaka');
  });
});
