// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildSupportContext, chatScript, type SupportFacts } from './support';

const NOW = Date.parse('2026-09-23T08:00:00Z');
const base: SupportFacts = { orderId: 'SW-1', stage: 'in_transit', firstName: 'Tahmid' };

describe('support chat scripts follow the order status', () => {
  it('never claims "marked delivered" for an order that isn’t delivered', () => {
    const s = chatScript({ ...base, statusLine: 'Arriving tomorrow' }, 'not_received');
    expect(s.opening).toContain('hasn’t been delivered yet — it’s arriving tomorrow');
    expect(s.opening).not.toMatch(/marked delivered/);
  });

  it('only apologises for a delay when the order is late', () => {
    expect(chatScript({ ...base, etaLabel: 'tomorrow' }, 'delayed').opening).toContain(
      'isn’t showing a delay and is expected tomorrow',
    );
    const late = chatScript({ ...base, stage: 'late', reason: 'Heavy rain.' }, 'delayed');
    expect(late.opening).toContain('I’m sorry order #SW-1 is running late. Heavy rain.');
    expect(late.reply).toContain('If the date moves again');
    expect(chatScript({ ...base, stage: 'late', canCancel: true }, 'delayed').reply).toContain(
      'cancel for a full refund',
    );
  });

  it('answers "where is my order?" correctly once delivered, and keeps capitalisation', () => {
    const s = chatScript(
      {
        ...base,
        stage: 'delivered',
        deliveredLabel: 'on Sat, 19 Sep at 3:40 PM',
        statusLine: 'Delivered Sat, 19 Sep',
      },
      'where_is_order',
    );
    expect(s.opening).toContain('Order #SW-1 was delivered on Sat, 19 Sep at 3:40 PM.');
    expect(s.reply).not.toMatch(/Tracking goes live/);
  });

  it('stays neutral when the order couldn’t be loaded', () => {
    const s = chatScript({ orderId: 'SW-1', stage: 'unknown' }, 'where_is_order');
    expect(s.reply).not.toMatch(/Tracking goes live/);
    expect(s.opening).toContain('your order itself is safe');
  });

  it('lowercases only the first letter of the status line', () => {
    const s = chatScript({ ...base, statusLine: 'Arriving Friday' }, 'where_is_order');
    expect(s.opening).toContain('— arriving Friday.');
  });

  it('builds hours from SUPPORT_HOURS', () => {
    expect(buildSupportContext(base, 'other', NOW).hoursLabel).toBe('9 AM – 9 PM daily');
  });
});
