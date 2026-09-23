import { CASE_UPDATE_HOURS, MISSING_WAIT_HOURS } from './constants';
import { MISSING_REASONS, PLACEMENT_LABEL } from './copy';
import { formatDateTimePhrase, formatMoney, formatPayment, plural } from './format';
import { makeRef } from './ids';
import type { StatusFacts } from './status';
import { HOUR, toIso } from './time';
import type { CancellationRequest, MissingReason, Order, SupportCase } from './types';
import type { MissingFlowView, RefundFlowView } from './view-model';

/* ---------------- Delivered but not received ---------------- */

export function missingFlowView(
  order: Order,
  facts: StatusFacts,
  now: number,
): MissingFlowView | undefined {
  if (facts.deliveredAt === null) return undefined;
  const pod = order.shipment?.proofOfDelivery;
  const waitUntil = facts.deliveredAt + MISSING_WAIT_HOURS * HOUR;
  const placement = pod ? PLACEMENT_LABEL[pod.placement] : 'Marked delivered';
  return {
    orderId: order.id,
    deliveredLabel: formatDateTimePhrase(facts.deliveredAt, now),
    placementLabel: placement,
    waitUntilLabel: formatDateTimePhrase(waitUntil, now),
    suggestWaiting: now < waitUntil,
    checklist: [
      pod?.placement === 'front_door'
        ? 'Check around your door, porch and letterbox — the rider’s photo shows it at the front door.'
        : 'Check around your door, porch and letterbox.',
      'Ask building reception, security or neighbours if they took it in.',
      'Ask anyone at home if they signed for it or moved it.',
    ],
    reasons: MISSING_REASONS,
    nextSteps: [
      'The carrier reviews the rider’s GPS trail and delivery photo.',
      `We update you by SMS within ${CASE_UPDATE_HOURS} hours.`,
      'If it isn’t found, you choose a replacement or a full refund.',
    ],
  };
}

export function createSupportCase(
  input: { reason: MissingReason; note?: string },
  now: number,
  rng: () => number,
): SupportCase {
  const note = input.note?.trim();
  return {
    id: makeRef('CASE', rng),
    kind: 'missing_package',
    reason: input.reason,
    ...(note ? { note } : {}),
    openedAt: toIso(now),
    nextUpdateBy: toIso(now + CASE_UPDATE_HOURS * HOUR),
  };
}

/* ---------------- Significant delay: refund or cancel ---------------- */

export function refundFlowView(order: Order, facts: StatusFacts): RefundFlowView {
  const isCod = order.payment.type === 'cod';
  const amount = formatMoney(order.pricing.total);
  const to = formatPayment(order.payment);
  return {
    delayLabel: `Your order is ${plural(facts.delayDays, 'day')} late`,
    isCod,
    cancelLabel: isCod ? 'Cancel this order' : `Cancel and refund ${amount}`,
    cancelDescription: isCod
      ? 'Nothing has been charged, so there’s nothing to refund.'
      : `Refunded to ${to} within 5–7 business days.`,
    keepLabel: 'Keep waiting',
    keepDescription: 'We’ll text you if the delivery date changes again.',
    outcome: {
      title: 'Cancellation requested',
      body: isCod
        ? 'We’ve asked the carrier to return the parcel. Nothing was charged.'
        : `We’ve asked the carrier to return the parcel. ${amount} goes back to ${to} within 5–7 business days.`,
    },
  };
}

export function createCancellationRequest(
  order: Order,
  now: number,
  rng: () => number,
): CancellationRequest {
  return {
    id: makeRef('RF', rng),
    requestedAt: toIso(now),
    refund: order.payment.type === 'cod' ? null : order.pricing.total,
  };
}
