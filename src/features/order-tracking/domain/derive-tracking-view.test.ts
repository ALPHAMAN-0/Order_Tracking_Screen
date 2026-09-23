// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { deriveTrackingView } from './derive-tracking-view';
import { deriveFacts, resolveStatus } from './status';
import { atDhaka, HOUR, MINUTE, toIso } from './time';
import { EMPTY_CLIENT_STATE, type Order, type OrderClientState, type TrackingEvent } from './types';

const NOW = Date.parse('2026-09-23T08:00:00Z'); // Wed 23 Sep, 2:00 PM Dhaka
const hoursAgo = (h: number) => toIso(NOW - h * HOUR);
const day = (offset: number, hhmm: string) => toIso(atDhaka(offset, hhmm, NOW));
const window = (offset: number) => ({ start: day(offset, '10:00'), end: day(offset, '18:00') });

const ev = (id: string, h: number, e: Partial<TrackingEvent>): TrackingEvent => ({
  id,
  at: hoursAgo(h),
  source: 'carrier',
  message: e.message ?? id,
  ...e,
});

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'SW-1',
    placedAt: hoursAgo(48),
    customerFirstName: 'Test',
    items: [
      {
        id: 'a',
        name: 'Thing',
        quantity: 1,
        unitPrice: { amount: 1000, currency: 'BDT' },
        category: 'home',
      },
    ],
    pricing: {
      subtotal: { amount: 1000, currency: 'BDT' },
      deliveryFee: { amount: 60, currency: 'BDT' },
      discount: { amount: 0, currency: 'BDT' },
      total: { amount: 1060, currency: 'BDT' },
    },
    payment: { type: 'card', last4: '4242' },
    shippingAddress: {
      recipient: 'T',
      phone: '+8801712345621',
      line1: 'House 1, Road 1',
      area: 'Gulshan',
      city: 'Dhaka',
      postcode: '1212',
    },
    promisedWindow: window(1),
    shipment: { carrier: { id: 'c', name: 'SwiftBD Express', phone: '' }, trackingNumber: 'T-1' },
    events: [
      ev('placed', 48, { source: 'merchant', milestone: 'placed' }),
      ev('processing', 40, { source: 'merchant', milestone: 'processing' }),
      ev('shipped', 20, { milestone: 'shipped', location: 'Tejgaon Hub' }),
    ],
    ...overrides,
  };
}

const status = (order: Order, cs: OrderClientState = EMPTY_CLIENT_STATE, now = NOW) =>
  resolveStatus(deriveFacts(order, now), cs).status;

const withCase: OrderClientState = {
  ...EMPTY_CLIENT_STATE,
  case: {
    id: 'CASE-ABC234',
    kind: 'missing_package',
    reason: 'nothing_delivered',
    openedAt: hoursAgo(0),
    nextUpdateBy: day(2, '14:00'),
  },
};

const shipment = (revised?: { start: string; end: string }) => ({
  carrier: { id: 'c', name: 'SwiftBD Express', phone: '' },
  trackingNumber: 'T-1',
  ...(revised ? { revisedWindow: revised } : {}),
});

describe('status precedence', () => {
  it('on time → on_track', () => {
    expect(status(makeOrder())).toBe('on_track');
  });

  it.each([
    [1, 'late'],
    [2, 'late'],
    [3, 'severely_late'],
    [5, 'severely_late'],
  ])('revised %i day(s) later → %s', (days, expected) => {
    const order = makeOrder({ promisedWindow: window(1 - days), shipment: shipment(window(1)) });
    expect(status(order)).toBe(expected);
  });

  it('same-day overdue by an hour → late with "a few hours" copy', () => {
    const order = makeOrder({ promisedWindow: { start: hoursAgo(9), end: hoursAgo(1) } });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.status).toBe('late');
    expect(vm.eta.note?.text).toBe('A few hours late');
    expect(vm.hero.subline).toBe('Running a few hours behind — still on its way.');
  });

  it('overdue 4 days with no revision → severely_late, awaiting a new date', () => {
    const order = makeOrder({ promisedWindow: window(-4) });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.status).toBe('severely_late');
    expect(vm.eta.value).toBe('Awaiting a new date');
  });

  it('revised estimate also passed → escalates and says so', () => {
    const order = makeOrder({ promisedWindow: window(-3), shipment: shipment(window(-1)) });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.status).toBe('severely_late');
    expect(vm.eta.note?.text).toBe('The updated estimate has passed too');
  });

  it('revised earlier → on_track with the new window', () => {
    const order = makeOrder({ promisedWindow: window(3), shipment: shipment(window(1)) });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.status).toBe('on_track');
    expect(vm.eta.value).toBe('Tomorrow, Thu 24 Sep');
    expect(vm.eta.note?.text).toBe('Updated by the carrier');
  });

  it('late while out for delivery keeps the current step', () => {
    const order = makeOrder({
      promisedWindow: window(-1),
      shipment: shipment(window(0)),
      events: [...makeOrder().events, ev('ofd', 2, { milestone: 'out_for_delivery' })],
    });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.status).toBe('late');
    expect(vm.hero.subline).toMatch(/^Out for delivery now — 1 day later than planned/);
    expect(vm.timeline.steps.find((s) => s.state === 'current')?.key).toBe('out_for_delivery');
  });

  it('no carrier scans → preparing, stale after 48h', () => {
    const fresh = makeOrder({
      shipment: null,
      placedAt: hoursAgo(3),
      events: makeOrder().events.slice(0, 2),
      promisedWindow: window(3),
    });
    expect(status(fresh)).toBe('preparing');
    expect(
      deriveTrackingView({ order: fresh, now: NOW, clientState: EMPTY_CLIENT_STATE }).pending
        ?.stale,
    ).toBeUndefined();

    const stale = { ...fresh, placedAt: hoursAgo(50) };
    expect(
      deriveTrackingView({ order: stale, now: NOW, clientState: EMPTY_CLIENT_STATE }).pending?.stale
        ?.title,
    ).toBe('Taking longer than usual');
  });

  it('pending tracking with ETA passed → late, shows delay banner AND pending card', () => {
    const order = makeOrder({
      shipment: null,
      events: makeOrder().events.slice(0, 2),
      promisedWindow: window(-1),
    });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.status).toBe('late');
    expect(vm.delay).toBeDefined();
    expect(vm.pending).toBeDefined();
    expect(vm.delay?.reason).toBe('Your order hasn’t been handed to the carrier yet.');
  });

  it('delivered late is still delivered; delivered + case → investigating', () => {
    const delivered = makeOrder({
      promisedWindow: window(-5),
      events: [...makeOrder().events, ev('dlv', 2, { milestone: 'delivered' })],
    });
    expect(status(delivered)).toBe('delivered');
    expect(status(delivered, withCase)).toBe('investigating');
  });

  it('ignores a case on an undelivered order', () => {
    expect(status(makeOrder(), withCase)).toBe('on_track');
  });

  it('milestones are monotonic and skipped steps count as complete', () => {
    const order = makeOrder({
      events: [
        ev('ofd', 2, { milestone: 'out_for_delivery' }),
        ev('placed', 48, { source: 'merchant', milestone: 'placed' }),
      ],
    });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.timeline.steps.map((s) => s.state)).toEqual([
      'complete',
      'complete',
      'complete',
      'current',
      'upcoming',
    ]);
    expect(vm.progress.label).toBe('Step 4 of 5: Out for delivery');
  });
});

describe('view model', () => {
  it('always has 5 steps with exactly one current', () => {
    for (const order of [
      makeOrder(),
      makeOrder({ shipment: null, events: makeOrder().events.slice(0, 1) }),
    ]) {
      const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
      expect(vm.timeline.steps).toHaveLength(5);
      expect(vm.timeline.steps.filter((s) => s.state === 'current')).toHaveLength(1);
    }
  });

  it('attaches the latest exception to the current step', () => {
    const order = makeOrder({
      promisedWindow: window(-1),
      shipment: shipment(window(1)),
      events: [
        ...makeOrder().events,
        ev('rain', 5, { exception: 'weather', location: 'Chattogram Hub', message: 'Rain' }),
      ],
    });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    const current = vm.timeline.steps.find((s) => s.state === 'current');
    expect(current?.note).toEqual({ tone: 'warning', text: 'Heavy rain · Chattogram Hub' });
    expect(vm.delay?.reason).toBe('Heavy rain slowed deliveries at Chattogram Hub.');
  });

  it.each([
    ['on time', makeOrder(), undefined, undefined],
    [
      'late',
      makeOrder({ promisedWindow: window(-1), shipment: shipment(window(1)) }),
      'contact_support',
      undefined,
    ],
    [
      'severe',
      makeOrder({ promisedWindow: window(-4), shipment: shipment(window(1)) }),
      'request_refund_or_cancel',
      'contact_support',
    ],
  ])('actions: %s', (_, order, primary, secondary) => {
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.primaryAction?.id).toBe(primary);
    expect(vm.secondaryAction?.id).toBe(secondary);
  });

  it('COD severe delay offers "Cancel order" and no refund amount', () => {
    const order = makeOrder({
      payment: { type: 'cod' },
      promisedWindow: window(-4),
      shipment: shipment(window(1)),
    });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.primaryAction?.label).toBe('Cancel order');
    expect(vm.refundFlow?.cancelLabel).toBe('Cancel this order');
  });

  it('a cancellation becomes its own state — no more delivery promises', () => {
    const order = makeOrder({ promisedWindow: window(-4), shipment: shipment(window(1)) });
    const cs: OrderClientState = {
      ...EMPTY_CLIENT_STATE,
      cancellation: {
        id: 'RF-XYZ234',
        requestedAt: hoursAgo(0),
        refund: { amount: 1060, currency: 'BDT' },
      },
    };
    const vm = deriveTrackingView({ order, now: NOW, clientState: cs });
    expect(vm.status).toBe('cancelled');
    expect(vm.hero).toMatchObject({ pill: 'Cancelling', headline: 'Refund on its way' });
    expect(vm.eta).toMatchObject({
      label: 'Refund expected',
      value: 'Within 5–7 business days',
      window: '৳1,060 to Card •••• 4242',
    });
    expect(vm.eta.was).toBeUndefined();
    expect(vm.cancellationBanner).toMatchObject({
      title: 'Cancellation requested',
      reference: 'RF-XYZ234',
    });
    expect(vm.cancellationBanner?.body).toContain('৳1,060 goes back to Card •••• 4242');
    expect(vm.delay).toBeUndefined();
    expect(vm.refundFlow).toBeUndefined();
    expect(vm.primaryAction?.id).toBe('contact_support');
    expect(vm.support.topic).toBe('cancel_refund');
    expect(vm.timeline.steps.at(-1)?.detail).toBe('Order cancelled');
    expect(vm.listItem).toMatchObject({ chip: 'Cancelling', statusLine: 'Refund on its way' });
  });

  it('a COD cancellation says there is nothing to refund', () => {
    const order = makeOrder({
      payment: { type: 'cod' },
      promisedWindow: window(-4),
      shipment: shipment(window(1)),
    });
    const cs: OrderClientState = {
      ...EMPTY_CLIENT_STATE,
      cancellation: { id: 'RF-COD234', requestedAt: hoursAgo(0), refund: null },
    };
    const vm = deriveTrackingView({ order, now: NOW, clientState: cs });
    expect(vm.hero.headline).toBe('Order cancelled');
    expect(vm.eta.value).toBe('Nothing to refund');
  });

  it('an EARLIER carrier estimate that has passed falls back to the promise (not late)', () => {
    // Promised in 3 days; carrier said "earlier, yesterday" — and missed it.
    const order = makeOrder({ promisedWindow: window(3), shipment: shipment(window(-1)) });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.status).toBe('on_track');
    expect(vm.eta.value).toBe('Sat, 26 Sep');
    expect(vm.eta.note).toBeUndefined();
  });

  it('pending tracking on a late or stale order doesn’t call the wait normal', () => {
    const base = { shipment: null, events: makeOrder().events.slice(0, 2) };
    const late = deriveTrackingView({
      order: makeOrder({ ...base, promisedWindow: window(-1) }),
      now: NOW,
      clientState: EMPTY_CLIENT_STATE,
    });
    expect(late.pending?.body).not.toMatch(/normal/);
    expect(late.pending?.nextSteps.at(-1)).toBe(
      'We confirm a new delivery date as soon as it ships.',
    );

    const stale = deriveTrackingView({
      order: makeOrder({ ...base, placedAt: hoursAgo(50), promisedWindow: window(3) }),
      now: NOW,
      clientState: EMPTY_CLIENT_STATE,
    });
    expect(stale.status).toBe('preparing');
    expect(stale.hero.subline).toMatch(/longer than usual/);
    expect(stale.pending?.body).not.toMatch(/normal/);
  });

  it('a multi-day window reads as a range in the timeline and chat', () => {
    const order = makeOrder({
      shipment: null,
      events: makeOrder().events.slice(0, 2),
      placedAt: hoursAgo(3),
      promisedWindow: { start: day(2, '10:00'), end: day(4, '20:00') },
    });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.timeline.steps.at(-1)?.detail).toBe('Expected Fri 25 – Sun 27 Sep');
    expect(vm.support.chatByTopic.where_is_order.reply).toContain(
      'expected between Fri 25 and Sun 27 Sep',
    );
  });

  it.each([
    [2, 'report_missing', false],
    [71, 'report_missing', false],
    [80, undefined, true],
    [15 * 24, undefined, false],
  ])('delivered %ih ago → primary %s, report link %s', (h, primary, link) => {
    const order = makeOrder({
      promisedWindow: window(-20),
      events: [
        ...makeOrder().events.map((e) => ({ ...e, at: toIso(Date.parse(e.at) - 20 * 24 * HOUR) })),
        ev('dlv', h, { milestone: 'delivered' }),
      ],
    });
    const vm = deriveTrackingView({ order, now: NOW, clientState: EMPTY_CLIENT_STATE });
    expect(vm.primaryAction?.id).toBe(primary);
    expect(!!vm.proofOfDelivery?.reportLink).toBe(link);
  });

  it('investigation shows the case banner and marks the delivered step', () => {
    const order = makeOrder({
      events: [...makeOrder().events, ev('dlv', 2, { milestone: 'delivered' })],
    });
    const vm = deriveTrackingView({ order, now: NOW, clientState: withCase });
    expect(vm.caseBanner).toMatchObject({ title: 'Investigation open', reference: 'CASE-ABC234' });
    expect(vm.hero.headline).toBe('We’re looking into it');
    expect(vm.timeline.steps.at(-1)?.note?.text).toContain('CASE-ABC234');
    expect(vm.missingFlow).toBeUndefined();
    expect(vm.support.topic).toBe('not_received');
  });

  it('builds support context with tel and prefilled mailto', () => {
    const vm = deriveTrackingView({
      order: makeOrder(),
      now: NOW,
      clientState: EMPTY_CLIENT_STATE,
    });
    expect(vm.support.phoneHref).toBe('tel:+8801000123456');
    const mail = vm.support.emailHrefByTopic.delayed;
    expect(mail.startsWith('mailto:care@haatbox.example?subject=')).toBe(true);
    expect(decodeURIComponent(mail)).toContain('Order #SW-1 — Delayed delivery');
    expect(vm.support.availability).toEqual({ open: true, label: 'Open now · until 9 PM' });
    const closed = deriveTrackingView({
      order: makeOrder(),
      now: NOW + 8 * HOUR,
      clientState: EMPTY_CLIENT_STATE,
    });
    expect(closed.support.availability.label).toBe('Closed now · opens 9 AM tomorrow');
  });

  it('is deterministic for the same inputs', () => {
    const a = deriveTrackingView({ order: makeOrder(), now: NOW, clientState: EMPTY_CLIENT_STATE });
    const b = deriveTrackingView({
      order: makeOrder(),
      now: NOW + 0 * MINUTE,
      clientState: EMPTY_CLIENT_STATE,
    });
    expect(a).toEqual(b);
  });
});
