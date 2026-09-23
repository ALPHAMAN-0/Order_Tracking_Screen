import {
  LATE_MIN_DAYS,
  REPORT_PROMINENT_HOURS,
  REPORT_WINDOW_DAYS,
  SEVERE_DELAY_DAYS,
  TRACKING_STALE_HOURS,
} from './constants';
import { DAY, HOUR, dhakaDayDiff, toMs } from './time';
import {
  MILESTONES,
  type EtaWindow,
  type Milestone,
  type Order,
  type OrderClientState,
  type TrackingEvent,
} from './types';
import type { Tone, TrackingStatus } from './view-model';

export type Severity = 'none' | 'late' | 'severe';

/** Facts about an order at an instant — no copy, no formatting. */
export interface StatusFacts {
  events: TrackingEvent[];
  milestoneIndex: number;
  milestone: Milestone;
  trackingLive: boolean;
  delivered: boolean;
  deliveredAt: number | null;
  promisedEnd: number;
  /** Revised window end if the carrier revised it (and it still applies), else the promise. */
  expectedBy: number;
  /** Whether the carrier's revised window is the one in force. */
  useRevision: boolean;
  /** The delivery window currently in force (revised or promised). */
  expectedWindow: EtaWindow;
  overdue: boolean;
  delayDays: number;
  severity: Severity;
  etaChanged: boolean;
  /** Late, and the carrier's revised estimate has passed as well. */
  revisedAlsoPassed: boolean;
  stalePending: boolean;
  latestEvent: TrackingEvent | null;
  latestException: TrackingEvent | null;
  hoursSinceDelivery: number | null;
  reportProminent: boolean;
  reportAllowed: boolean;
}

export function deriveFacts(order: Order, now: number): StatusFacts {
  const events = [...order.events].sort((a, b) => toMs(a.at) - toMs(b.at));

  // Monotonic: the furthest milestone reached wins, so out-of-order scans
  // don't move the order backwards and skipped steps count as complete.
  let milestoneIndex = 0;
  for (const event of events) {
    if (event.milestone)
      milestoneIndex = Math.max(milestoneIndex, MILESTONES.indexOf(event.milestone));
  }
  const milestone = MILESTONES[milestoneIndex] ?? 'placed';

  const trackingLive = order.shipment !== null && events.some((e) => e.source === 'carrier');
  const delivered = milestone === 'delivered';

  const deliveredEvent = events.find((e) => e.milestone === 'delivered');
  const podAt = order.shipment?.proofOfDelivery?.at;
  const deliveredAt = delivered ? toMs(deliveredEvent?.at ?? podAt ?? order.placedAt) : null;

  const promisedEnd = toMs(order.promisedWindow.end);
  const revised = order.shipment?.revisedWindow;
  const revisedEnd = revised ? toMs(revised.end) : null;
  // A carrier estimate EARLIER than the promise stops counting once it passes:
  // the customer was never promised that date, so missing it isn't "late".
  const useRevision = revisedEnd !== null && (revisedEnd >= promisedEnd || now <= revisedEnd);
  const expectedBy = useRevision ? revisedEnd : promisedEnd;
  const overdue = !delivered && now > expectedBy;

  const reference = overdue ? now : expectedBy;
  const delayDays = delivered ? 0 : Math.max(0, dhakaDayDiff(promisedEnd, reference));

  let severity: Severity = 'none';
  if (!delivered) {
    if (delayDays >= SEVERE_DELAY_DAYS) severity = 'severe';
    else if (delayDays >= LATE_MIN_DAYS || overdue) severity = 'late';
  }

  const etaChanged =
    !!revised &&
    (revised.start !== order.promisedWindow.start || revised.end !== order.promisedWindow.end);

  const hoursSinceDelivery = deliveredAt === null ? null : (now - deliveredAt) / HOUR;

  return {
    events,
    milestoneIndex,
    milestone,
    trackingLive,
    delivered,
    deliveredAt,
    promisedEnd,
    expectedBy,
    useRevision,
    expectedWindow: useRevision && revised ? revised : order.promisedWindow,
    overdue,
    delayDays,
    severity,
    etaChanged,
    revisedAlsoPassed: useRevision && overdue,
    stalePending:
      !trackingLive && !delivered && now - toMs(order.placedAt) > TRACKING_STALE_HOURS * HOUR,
    latestEvent: events.at(-1) ?? null,
    latestException: [...events].reverse().find((e) => e.exception) ?? null,
    hoursSinceDelivery,
    reportProminent: hoursSinceDelivery !== null && hoursSinceDelivery <= REPORT_PROMINENT_HOURS,
    reportAllowed:
      hoursSinceDelivery !== null && hoursSinceDelivery <= (REPORT_WINDOW_DAYS * DAY) / HOUR,
  };
}

/**
 * Status precedence — the first matching row wins:
 * 1. delivered + open case     → investigating
 * 2. delivered                 → delivered
 * 3. cancellation requested    → cancelled
 * 4. severe delay              → severely_late
 * 5. late                      → late
 * 6. no carrier scans yet      → preparing
 * 7. otherwise                 → on_track
 */
export function resolveStatus(
  facts: StatusFacts,
  clientState: OrderClientState,
): { status: TrackingStatus; tone: Tone } {
  if (facts.delivered && clientState.case) return { status: 'investigating', tone: 'danger' };
  if (facts.delivered) return { status: 'delivered', tone: 'success' };
  if (clientState.cancellation) return { status: 'cancelled', tone: 'neutral' };
  if (facts.severity === 'severe') return { status: 'severely_late', tone: 'danger' };
  if (facts.severity === 'late') return { status: 'late', tone: 'warning' };
  if (!facts.trackingLive) return { status: 'preparing', tone: 'neutral' };
  return { status: 'on_track', tone: 'success' };
}
