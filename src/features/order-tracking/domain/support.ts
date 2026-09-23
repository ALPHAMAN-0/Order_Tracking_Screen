import {
  SUPPORT_AGENT,
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_TEAM,
} from './constants';
import { TOPIC_LABEL } from './copy';
import { formatTime } from './format';
import { atDhaka, dhakaMinutesOfDay, isWithinDhakaHours, parseHHmm } from './time';
import type { ChatScript, SupportContextView, TopicId } from './view-model';

export const TOPIC_ORDER: TopicId[] = [
  'where_is_order',
  'delayed',
  'not_received',
  'cancel_refund',
  'change_address',
  'other',
];

/**
 * Where the order is, as far as support is concerned. `unknown` is used when
 * the order couldn't be loaded (error state) — scripts then stay neutral.
 */
export type SupportStage =
  'unknown' | 'preparing' | 'in_transit' | 'late' | 'delivered' | 'cancelled';

/** Order context the support sheet and mock chat can reference. */
export interface SupportFacts {
  orderId: string;
  stage: SupportStage;
  firstName?: string;
  statusLine?: string;
  etaLabel?: string;
  reason?: string;
  deliveredLabel?: string;
  caseId?: string;
  /** A refund/cancel path is offered on the screen right now. */
  canCancel?: boolean;
}

/** "Arriving tomorrow" → "arriving tomorrow" (keeps dates and names intact). */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function supportAvailability(now: number): { open: boolean; label: string } {
  const open = isWithinDhakaHours(now, SUPPORT_HOURS.open, SUPPORT_HOURS.close);
  const closeLabel = formatTime(atDhaka(0, SUPPORT_HOURS.close, now), { compact: true });
  const openLabel = formatTime(atDhaka(0, SUPPORT_HOURS.open, now), { compact: true });
  if (open) return { open, label: `Open now · until ${closeLabel}` };
  const beforeOpening = dhakaMinutesOfDay(now) < parseHHmm(SUPPORT_HOURS.open);
  return { open, label: `Closed now · opens ${openLabel}${beforeOpening ? '' : ' tomorrow'}` };
}

export function mailtoHref(facts: SupportFacts, topic: TopicId): string {
  const subject = `Order #${facts.orderId} — ${TOPIC_LABEL[topic]}`;
  const body = [
    `Hi ${SUPPORT_TEAM},`,
    '',
    `I need help with order #${facts.orderId} (${TOPIC_LABEL[topic].toLowerCase()}).`,
    facts.caseId ? `Case reference: ${facts.caseId}` : null,
    '',
    '[Tell us what happened]',
    '',
    `Thanks${facts.firstName ? `,\n${facts.firstName}` : ''}`,
  ]
    .filter((line) => line !== null)
    .join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function chatScript(facts: SupportFacts, topic: TopicId): ChatScript {
  const hi = `Hi${facts.firstName ? ` ${facts.firstName}` : ''}, I’m ${SUPPORT_AGENT} from ${SUPPORT_TEAM}.`;
  const order = `order #${facts.orderId}`;
  const { stage } = facts;
  switch (topic) {
    case 'where_is_order':
      if (stage === 'delivered')
        return {
          opening: `${hi} ${capitalize(order)} was delivered${facts.deliveredLabel ? ` ${facts.deliveredLabel}` : ''}.`,
          draft: 'Where exactly was it left?',
          reply:
            'The rider’s proof of delivery is on your tracking page. If you can’t find the parcel, pick “Marked delivered, not received” and I’ll open an investigation.',
        };
      if (stage === 'cancelled')
        return {
          opening: `${hi} ${capitalize(order)} is being cancelled and returned to the seller.`,
          draft: 'When will I get my refund?',
          reply:
            'Refunds go back to your original payment method within 5–7 business days of the cancellation.',
        };
      if (stage === 'unknown')
        return {
          opening: `${hi} I can see ${order}. Our tracking view is having trouble right now, but your order itself is safe.`,
          draft: 'Where is my order?',
          reply:
            'I’m checking the latest scan with the carrier now and will reply here within a few minutes.',
        };
      return {
        opening: `${hi} I can see ${order}${facts.statusLine ? ` — ${lowerFirst(facts.statusLine)}` : ''}. What would you like to know?`,
        draft: 'When will my order arrive?',
        reply: facts.etaLabel
          ? `It’s currently expected ${facts.etaLabel}. You’ll get an SMS when it’s out for delivery, and the tracking page updates automatically.`
          : 'Tracking goes live as soon as the carrier scans your parcel. You’ll get an SMS the moment that happens.',
      };
    case 'delayed':
      if (stage === 'late')
        return {
          opening: `${hi} I’m sorry ${order} is running late${facts.reason ? `. ${facts.reason}` : '.'}`,
          draft: 'Can you do anything to speed it up?',
          reply: `I’ve flagged your parcel as a priority with the carrier${facts.etaLabel ? ` — the latest estimate is ${facts.etaLabel}` : ''}. ${
            facts.canCancel
              ? 'If you’d rather not wait, you can cancel for a full refund from the tracking page.'
              : 'If the date moves again, you’ll hear from us straight away.'
          }`,
        };
      return {
        opening: `${hi} ${
          stage === 'delivered'
            ? `${capitalize(order)} has already been delivered.`
            : stage === 'unknown'
              ? `Let me check ${order} for any delays.`
              : `Good news — ${order} isn’t showing a delay${facts.etaLabel ? ` and is expected ${facts.etaLabel}` : ''}.`
        }`,
        draft: 'I’m worried it will be late.',
        reply:
          'If the carrier reports any delay, you’ll get an SMS and the tracking page will show the new date and the reason.',
      };
    case 'not_received':
      if (facts.caseId)
        return {
          opening: `${hi} Your case ${facts.caseId} for ${order} is open and I’m following it.`,
          draft: 'Is there any update on my case?',
          reply:
            'The carrier is reviewing the rider’s GPS trail and delivery photo now. If the parcel isn’t found, we’ll send a replacement or a full refund — your choice.',
        };
      if (stage === 'delivered')
        return {
          opening: `${hi} I see ${order} was marked delivered${facts.deliveredLabel ? ` ${facts.deliveredLabel}` : ''}, but it hasn’t reached you. Let’s sort that out.`,
          draft: 'The parcel isn’t here. What should I do?',
          reply:
            'Sorry about that. Please check with reception and neighbours first. If it’s still missing, tap “I didn’t receive it” on the tracking page and I’ll open an investigation right away.',
        };
      return {
        opening: `${hi} ${capitalize(order)} hasn’t been delivered yet${facts.statusLine ? ` — it’s ${lowerFirst(facts.statusLine)}` : ''}.`,
        draft: 'What if it’s marked delivered but I don’t get it?',
        reply:
          'Then tell us from the tracking page or here, and I’ll open an investigation with the carrier straight away.',
      };
    case 'cancel_refund':
      return {
        opening: `${hi} I can help with cancelling or refunding ${order}.`,
        draft: 'How long does a refund take?',
        reply:
          'Refunds go back to your original payment method within 5–7 business days. Cash on delivery orders aren’t charged, so there’s nothing to refund.',
      };
    case 'change_address':
      return {
        opening: `${hi} Need to update where ${order} goes?`,
        draft: 'Can I change my delivery address?',
        reply:
          stage === 'delivered' || stage === 'cancelled'
            ? 'This order can’t be redirected any more, but I can help with anything else about it.'
            : 'Once a parcel is with the carrier we can redirect it within the same city. Share the new address here and I’ll request the change.',
      };
    case 'other':
      return {
        opening: `${hi} How can I help with ${order}?`,
        draft: 'I have a question about my order.',
        reply: 'Of course — tell me a little more and I’ll take it from here.',
      };
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildSupportContext(
  facts: SupportFacts,
  topic: TopicId,
  now: number,
  initialView: 'channels' | 'chat' = 'channels',
): SupportContextView {
  const byTopic = <T>(fn: (t: TopicId) => T) =>
    Object.fromEntries(TOPIC_ORDER.map((t) => [t, fn(t)])) as Record<TopicId, T>;
  const hour = (hhmm: string) => formatTime(atDhaka(0, hhmm, now), { compact: true });
  return {
    orderId: facts.orderId,
    topic,
    initialView,
    topics: TOPIC_ORDER.map((id) => ({ id, label: TOPIC_LABEL[id] })),
    availability: supportAvailability(now),
    hoursLabel: `${hour(SUPPORT_HOURS.open)} – ${hour(SUPPORT_HOURS.close)} daily`,
    phoneHref: `tel:${SUPPORT_PHONE}`,
    phoneLabel: SUPPORT_PHONE_DISPLAY,
    emailLabel: SUPPORT_EMAIL,
    emailHrefByTopic: byTopic((t) => mailtoHref(facts, t)),
    chatByTopic: byTopic((t) => chatScript(facts, t)),
    agentName: SUPPORT_AGENT,
    teamName: SUPPORT_TEAM,
  };
}
