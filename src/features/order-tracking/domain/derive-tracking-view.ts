import { PLACEMENT_LABEL, STATUS_PILL, STEP_LABEL, delayReason } from './copy';
import { missingFlowView, refundFlowView } from './flows';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPayment,
  formatWeekdayLong,
  formatWindow,
  maskAddress,
  plural,
  relativeDayName,
} from './format';
import { orderDetailsView, orderSummaryView, orderTitle } from './order-summary';
import { deriveFacts, resolveStatus, type StatusFacts } from './status';
import { buildSupportContext, type SupportFacts } from './support';
import { timelineView } from './timeline';
import { dhakaDayDiff, toMs } from './time';
import { MILESTONES, type Order, type OrderClientState } from './types';
import type {
  ActionView,
  DelayView,
  EtaView,
  HeroView,
  OrderListItemView,
  PendingView,
  Tone,
  TopicId,
  TrackingStatus,
  TrackingViewModel,
} from './view-model';

export interface DeriveInput {
  order: Order;
  now: number;
  clientState: OrderClientState;
}

/**
 * THE single source of truth for what the tracking screen shows (R3).
 * Pure: same order + same `now` + same client state → same view model.
 */
export function deriveTrackingView({ order, now, clientState }: DeriveInput): TrackingViewModel {
  const facts = deriveFacts(order, now);
  const { status, tone } = resolveStatus(facts, clientState);
  const ctx: Ctx = { order, facts, status, tone, clientState, now };

  const hero = heroView(ctx);
  const eta = etaView(ctx);
  const actions = actionsFor(ctx);
  const reason = reasonText(ctx);
  const pod = order.shipment?.proofOfDelivery;

  const supportFacts: SupportFacts = {
    orderId: order.id,
    firstName: order.customerFirstName,
    statusLine: hero.headline,
    ...(facts.delivered ? {} : { etaLabel: etaPhrase(ctx) }),
    ...(facts.severity !== 'none' ? { reason } : {}),
    ...(facts.deliveredAt !== null
      ? { deliveredLabel: formatDateTime(facts.deliveredAt, now) }
      : {}),
    ...(clientState.case && facts.delivered ? { caseId: clientState.case.id } : {}),
  };

  const vm: TrackingViewModel = {
    orderId: order.id,
    status,
    tone,
    hero,
    eta,
    progress: {
      current: facts.milestoneIndex + 1,
      total: MILESTONES.length,
      label: `Step ${facts.milestoneIndex + 1} of ${MILESTONES.length}: ${STEP_LABEL[facts.milestone]}`,
    },
    timeline: timelineView(order, facts, status, tone, clientState, now),
    support: buildSupportContext(supportFacts, topicFor(ctx), now),
    summary: orderSummaryView(order),
    details: orderDetailsView(order),
    listItem: listItemView(ctx, hero),
    ...actions,
  };

  if (status === 'late' || status === 'severely_late') vm.delay = delayView(ctx, reason);
  if (!facts.trackingLive && !facts.delivered) vm.pending = pendingView(ctx);

  if (facts.delivered && facts.deliveredAt !== null) {
    vm.proofOfDelivery = {
      deliveredLabel: formatDateTime(facts.deliveredAt, now),
      placementLabel: pod ? PLACEMENT_LABEL[pod.placement] : 'Delivered',
      ...(pod?.receivedBy ? { receivedBy: pod.receivedBy } : {}),
      maskedAddress: maskAddress(order.shippingAddress),
      photoAlt: pod?.photoAlt ?? 'No delivery photo available',
      ...(status === 'delivered' && !facts.reportProminent && facts.reportAllowed
        ? { reportLink: { id: 'report_missing', label: 'Report a problem', emphasis: 'secondary' } }
        : {}),
    };
  }

  if (status === 'investigating' && clientState.case) {
    const flow = missingFlowView(order, facts, now);
    vm.caseBanner = {
      caseId: clientState.case.id,
      title: 'Investigation open',
      body: 'We’ve asked the carrier to check the rider’s GPS trail and delivery photo.',
      nextUpdateLabel: `Next update by ${formatDateTime(toMs(clientState.case.nextUpdateBy), now)}`,
      steps: flow?.nextSteps ?? [],
    };
  }

  if (status === 'delivered' && facts.reportAllowed) {
    const flow = missingFlowView(order, facts, now);
    if (flow) vm.missingFlow = flow;
  }

  if (clientState.cancellation && (status === 'late' || status === 'severely_late')) {
    const { id, refund } = clientState.cancellation;
    vm.cancellationBanner = {
      refId: id,
      title: 'Cancellation requested',
      body: refund
        ? `${formatMoney(refund)} goes back to ${formatPayment(order.payment)} within 5–7 business days. Reference ${id}.`
        : `Nothing was charged — cash on delivery orders are simply cancelled. Reference ${id}.`,
    };
  } else if (status === 'severely_late') {
    vm.refundFlow = refundFlowView(order, facts);
  }

  return vm;
}

/* ---------------------------------------------------------------------------- */

interface Ctx {
  order: Order;
  facts: StatusFacts;
  status: TrackingStatus;
  tone: Tone;
  clientState: OrderClientState;
  now: number;
}

/** "today" | "tomorrow" | "on Sat, 26 Sep" */
function dayPhrase(ms: number, now: number): string {
  const rel = relativeDayName(ms, now);
  return rel ? rel.toLowerCase() : `on ${formatDate(ms)}`;
}

function hasNewEstimate({ order, facts }: Ctx): boolean {
  return !!order.shipment?.revisedWindow && !facts.revisedAlsoPassed;
}

function etaPhrase(ctx: Ctx): string | undefined {
  const { facts, now } = ctx;
  if (facts.severity !== 'none' && !hasNewEstimate(ctx)) return undefined;
  return dayPhrase(facts.expectedBy, now);
}

function heroView(ctx: Ctx): HeroView {
  const { facts, status, clientState, now } = ctx;
  const pill = STATUS_PILL[status];
  const location = facts.latestEvent?.location;

  switch (status) {
    case 'on_track': {
      if (facts.milestone === 'out_for_delivery') {
        return { pill, headline: 'Out for delivery', subline: 'Your rider is on the way.' };
      }
      const days = dhakaDayDiff(now, facts.expectedBy);
      const headline =
        days <= 0
          ? 'Arriving today'
          : days === 1
            ? 'Arriving tomorrow'
            : days < 7
              ? `Arriving ${formatWeekdayLong(facts.expectedBy)}`
              : `Arriving ${formatDate(facts.expectedBy)}`;
      return {
        pill,
        headline,
        subline: location ? `On schedule · last scanned at ${location}` : 'On schedule',
      };
    }
    case 'late': {
      let subline: string;
      if (facts.milestone === 'out_for_delivery') {
        subline = `Out for delivery now — ${facts.delayDays > 0 ? `${plural(facts.delayDays, 'day')} later` : 'a little later'} than planned.`;
      } else if (hasNewEstimate(ctx)) {
        subline = `Now arriving ${dayPhrase(facts.expectedBy, now)}.`;
      } else if (facts.delayDays === 0) {
        subline = 'Running a few hours behind — still on its way.';
      } else {
        subline = 'We’re waiting for a new delivery date from the carrier.';
      }
      return { pill, headline: 'Running late', subline };
    }
    case 'severely_late':
      return {
        pill,
        headline: 'Significantly delayed',
        subline: `${plural(facts.delayDays, 'day')} past the original date. We’re sorry.`,
      };
    case 'preparing':
      return {
        pill,
        headline: 'Preparing your order',
        subline: 'Tracking appears once the carrier scans your parcel — usually within 24 hours.',
      };
    case 'delivered': {
      const pod = ctx.order.shipment?.proofOfDelivery;
      const when = formatDateTime(facts.deliveredAt ?? now, now);
      return {
        pill,
        headline: 'Delivered',
        subline: pod ? `${when} · ${PLACEMENT_LABEL[pod.placement]}` : when,
      };
    }
    case 'investigating': {
      const c = clientState.case;
      return {
        pill,
        headline: 'We’re looking into it',
        subline: c
          ? `Case ${c.id} · update by ${formatDateTime(toMs(c.nextUpdateBy), now)}`
          : 'Your report is with our team.',
      };
    }
  }
}

function etaView(ctx: Ctx): EtaView {
  const { order, facts, status, tone, now } = ctx;
  let view: Omit<EtaView, 'a11y'>;

  if (facts.delivered) {
    view = {
      label: status === 'investigating' ? 'Marked delivered' : 'Delivered',
      value: formatDateTime(facts.deliveredAt ?? now, now),
      ...(status === 'investigating'
        ? { note: { tone: 'danger', text: 'Reported not received' } }
        : {}),
    };
  } else if (facts.severity !== 'none') {
    const fresh = hasNewEstimate(ctx);
    const win =
      fresh && order.shipment?.revisedWindow
        ? formatWindow(order.shipment.revisedWindow, now)
        : null;
    view = {
      label: fresh ? 'New estimate' : 'Estimated delivery',
      value: win?.value ?? 'Awaiting a new date',
      ...(win?.window ? { window: win.window } : {}),
      was: formatDate(facts.promisedEnd),
      note: {
        tone,
        text: facts.revisedAlsoPassed
          ? 'The updated estimate has passed too'
          : facts.delayDays > 0
            ? `Delayed by ${plural(facts.delayDays, 'day')}`
            : 'A few hours late',
      },
    };
  } else {
    const win = formatWindow(order.shipment?.revisedWindow ?? order.promisedWindow, now);
    view = {
      label: 'Estimated delivery',
      value: win.value,
      ...(win.window ? { window: win.window } : {}),
      ...(status === 'preparing'
        ? { note: { tone: 'neutral', text: 'Based on your order date' } }
        : facts.etaChanged
          ? { note: { tone: 'neutral', text: 'Updated by the carrier' } }
          : {}),
    };
  }

  const a11y = [
    `${view.label}: ${view.value}${view.window ? `, ${view.window}` : ''}`,
    view.was ? `Originally ${view.was}` : null,
    view.note?.text ?? null,
  ]
    .filter(Boolean)
    .join('. ');
  return { ...view, a11y };
}

function reasonText({ facts }: Ctx): string {
  const ex = facts.latestException;
  if (ex?.exception) return delayReason(ex.exception, ex.location);
  if (!facts.trackingLive) return 'Your order hasn’t been handed to the carrier yet.';
  return 'The carrier hasn’t shared a reason yet.';
}

function delayView(ctx: Ctx, reason: string): DelayView {
  const { facts, status, tone, clientState } = ctx;
  const severe = status === 'severely_late';
  return {
    tone,
    title: severe ? 'Your order is significantly delayed' : 'Your order is running late',
    delayLabel:
      facts.delayDays > 0
        ? `Delayed by ${plural(facts.delayDays, 'day')}`
        : 'A few hours behind schedule',
    reason,
    reassurance: clientState.cancellation
      ? 'Your cancellation is being processed.'
      : severe
        ? 'You can keep waiting, or cancel for a full refund.'
        : 'No action needed — we’ll text you if anything changes.',
    toggle: {
      id: 'notify_changes',
      label: 'Notify me of changes',
      description: 'Get an SMS if the delivery date moves again',
      checked: clientState.notify.changes,
      confirmation: 'We’ll text you if the delivery date changes.',
    },
  };
}

function pendingView(ctx: Ctx): PendingView {
  const { order, facts, clientState, now } = ctx;
  return {
    title: 'Tracking will appear soon',
    body: 'Your order is confirmed and being packed. Live tracking starts as soon as the carrier scans your parcel — usually within 24 hours of packing.',
    expectation: `Estimated delivery: ${formatWindow(order.promisedWindow, now).value}`,
    toggle: {
      id: 'notify_tracking_live',
      label: 'Notify me when tracking is live',
      description: 'We’ll text you the moment the carrier scans it',
      checked: clientState.notify.trackingLive,
      confirmation: 'We’ll text you when tracking goes live.',
    },
    ...(facts.stalePending
      ? {
          stale: {
            title: 'Taking longer than usual',
            body: 'It’s been over 2 days without a carrier scan. We’ve flagged it with the seller — contact us if you need it sooner.',
          },
        }
      : {}),
  };
}

function actionsFor(ctx: Ctx): Pick<TrackingViewModel, 'primaryAction' | 'secondaryAction'> {
  const { order, facts, status, clientState } = ctx;
  const support = (label: string, emphasis: ActionView['emphasis']): ActionView => ({
    id: 'contact_support',
    label,
    emphasis,
  });
  switch (status) {
    case 'late':
      return { primaryAction: support('Ask about this delay', 'primary') };
    case 'severely_late':
      if (clientState.cancellation)
        return { primaryAction: support('Contact support', 'secondary') };
      return {
        primaryAction: {
          id: 'request_refund_or_cancel',
          label: order.payment.type === 'cod' ? 'Cancel order' : 'Request refund or cancel',
          emphasis: 'primary',
        },
        secondaryAction: support('Contact support', 'secondary'),
      };
    case 'delivered':
      return facts.reportProminent
        ? {
            primaryAction: {
              id: 'report_missing',
              label: 'I didn’t receive it',
              emphasis: 'secondary',
            },
          }
        : {};
    case 'investigating':
      return { primaryAction: support('Chat about my case', 'primary') };
    case 'on_track':
    case 'preparing':
      return {};
  }
}

function topicFor({ facts, status, clientState }: Ctx): TopicId {
  switch (status) {
    case 'late':
      return 'delayed';
    case 'severely_late':
      return clientState.cancellation ? 'cancel_refund' : 'delayed';
    case 'delivered':
      return facts.reportProminent ? 'not_received' : 'other';
    case 'investigating':
      return 'not_received';
    case 'on_track':
    case 'preparing':
      return 'where_is_order';
  }
}

function listItemView(ctx: Ctx, hero: HeroView): OrderListItemView {
  const { order, facts, status, tone, clientState, now } = ctx;
  let statusLine: string;
  switch (status) {
    case 'on_track':
      statusLine = hero.headline;
      break;
    case 'late':
      statusLine = hasNewEstimate(ctx)
        ? `Now arriving ${dayPhrase(facts.expectedBy, now)}`
        : 'New date to be confirmed';
      break;
    case 'severely_late':
      statusLine = clientState.cancellation
        ? 'Cancellation requested'
        : `${plural(facts.delayDays, 'day')} late · refund available`;
      break;
    case 'preparing':
      statusLine = 'Tracking available soon';
      break;
    case 'delivered':
      statusLine = formatDateTime(facts.deliveredAt ?? now, now);
      break;
    case 'investigating':
      statusLine = clientState.case ? `Case ${clientState.case.id}` : 'Report received';
      break;
  }
  return {
    id: order.id,
    href: `/orders/${order.id}`,
    title: orderTitle(order),
    meta: `#${order.id} · Placed ${formatDate(toMs(order.placedAt))}`,
    status,
    tone,
    chip: STATUS_PILL[status],
    statusLine,
    totalLabel: formatMoney(order.pricing.total),
    category: order.items[0]?.category ?? 'home',
    group: facts.delivered ? 'delivered' : 'in_progress',
  };
}
