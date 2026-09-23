// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { deriveTrackingView } from '@/features/order-tracking/domain/derive-tracking-view';
import { EMPTY_CLIENT_STATE } from '@/features/order-tracking/domain/types';
import { HOUR, toMs } from '@/features/order-tracking/domain/time';
import { ORDER_FIXTURES } from './fixtures/orders';
import { resolveOrderFixture } from './fixtures/resolve-order';
import { SCENARIOS } from './scenarios';

const EXPECTED: Record<string, { status: string; tone: string }> = {
  'SW-40211': { status: 'on_track', tone: 'success' },
  'SW-39870': { status: 'late', tone: 'warning' },
  'SW-39215': { status: 'severely_late', tone: 'danger' },
  'SW-40107': { status: 'delivered', tone: 'success' },
  'SW-40290': { status: 'preparing', tone: 'neutral' },
  'SW-38754': { status: 'delivered', tone: 'success' },
};

// Sweep "now" across 72h in 90-minute steps, plus month and year boundaries,
// to prove every scenario keeps its meaning whenever the page is opened.
const starts = ['2026-09-23T00:00:00Z', '2026-09-29T00:00:00Z', '2026-12-30T00:00:00Z'];
const instants = starts.flatMap((s) =>
  Array.from({ length: 48 }, (_, i) => Date.parse(s) + i * 1.5 * HOUR),
);

describe('fixtures are now-relative and stable', () => {
  it('registry and fixtures match', () => {
    expect(SCENARIOS.map((s) => s.orderId).sort()).toEqual(ORDER_FIXTURES.map((f) => f.id).sort());
  });

  it.each(ORDER_FIXTURES.map((f) => [f.id, f] as const))(
    '%s keeps its status at every instant',
    (id, fixture) => {
      for (const now of instants) {
        const order = resolveOrderFixture(fixture, now);
        const vm = deriveTrackingView({ order, now, clientState: EMPTY_CLIENT_STATE });
        expect({ status: vm.status, tone: vm.tone }, new Date(now).toISOString()).toEqual(
          EXPECTED[id],
        );

        const times = order.events.map((e) => toMs(e.at));
        expect(times.every((t) => t <= now)).toBe(true);
        expect(times).toEqual([...times].sort((a, b) => a - b));
        expect(toMs(order.promisedWindow.start)).toBeLessThan(toMs(order.promisedWindow.end));
        expect(toMs(order.placedAt)).toBeLessThan(toMs(order.promisedWindow.start));
        const { subtotal, deliveryFee, discount, total } = order.pricing;
        expect(total.amount).toBe(subtotal.amount + deliveryFee.amount - discount.amount);
        expect(total.amount).toBeLessThan(100_000);
      }
    },
  );

  it('delivered-not-received offers the report flow; baseline delivered only a link', () => {
    const now = Date.parse('2026-09-23T08:00:00Z');
    const vm = (id: string) =>
      deriveTrackingView({
        order: resolveOrderFixture(
          ORDER_FIXTURES.find((f) => f.id === id)!,
          now,
        ),
        now,
        clientState: EMPTY_CLIENT_STATE,
      });
    expect(vm('SW-40107').primaryAction?.id).toBe('report_missing');
    expect(vm('SW-40107').missingFlow).toBeDefined();
    expect(vm('SW-38754').primaryAction).toBeUndefined();
    expect(vm('SW-38754').proofOfDelivery?.reportLink?.label).toBe('Report a problem');
    expect(vm('SW-39870').eta).toMatchObject({
      label: 'New estimate',
      was: 'Tue, 22 Sep',
      note: { text: 'Delayed by 2 days' },
    });
    expect(vm('SW-39215').hero).toMatchObject({
      headline: '5 days late',
      subline: 'Now arriving tomorrow. We’re sorry for the wait.',
    });
    expect(vm('SW-40107').hero).toMatchObject({
      headline: 'Delivered today',
      subline: 'Left at front door',
    });
    expect(vm('SW-40290').eta.value).toBe('Fri 25 – Sun 27 Sep');
    expect(vm('SW-40211').hero.headline).toBe('Arriving tomorrow');
  });
});
