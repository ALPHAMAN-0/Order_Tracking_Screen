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

/** Order context the support sheet and mock chat can reference. */
export interface SupportFacts {
  orderId: string;
  firstName?: string;
  statusLine?: string;
  etaLabel?: string;
  reason?: string;
  deliveredLabel?: string;
  caseId?: string;
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
  switch (topic) {
    case 'where_is_order':
      return {
        opening: `${hi} I can see ${order}${facts.statusLine ? ` — ${facts.statusLine.toLowerCase()}` : ''}. What would you like to know?`,
        draft: 'When will my order arrive?',
        reply: facts.etaLabel
          ? `It’s currently expected ${facts.etaLabel}. You’ll get an SMS when it’s out for delivery, and the tracking page updates automatically.`
          : 'Tracking goes live as soon as the carrier scans your parcel. You’ll get an SMS the moment that happens.',
      };
    case 'delayed':
      return {
        opening: `${hi} I’m sorry ${order} is running late${facts.reason ? `. ${facts.reason}` : '.'}`,
        draft: 'Can you do anything to speed it up?',
        reply: `I’ve flagged your parcel as a priority with the carrier${facts.etaLabel ? ` — the latest estimate is ${facts.etaLabel}` : ''}. If it slips again you can cancel for a full refund at any time.`,
      };
    case 'not_received':
      return facts.caseId
        ? {
            opening: `${hi} Your case ${facts.caseId} for ${order} is open and I’m following it.`,
            draft: 'Is there any update on my case?',
            reply:
              'The carrier is reviewing the rider’s GPS trail and delivery photo now. If the parcel isn’t found, we’ll send a replacement or a full refund — your choice.',
          }
        : {
            opening: `${hi} I see ${order} was marked delivered${facts.deliveredLabel ? ` ${facts.deliveredLabel}` : ''}, but it hasn’t reached you. Let’s sort that out.`,
            draft: 'The parcel isn’t here. What should I do?',
            reply:
              'Sorry about that. Please check with reception and neighbours first. If it’s still missing, tap “I didn’t receive it” on the tracking page and I’ll open an investigation right away.',
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
          'Once a parcel is with the carrier we can redirect it within the same city. Share the new address here and I’ll request the change.',
      };
    case 'other':
      return {
        opening: `${hi} How can I help with ${order}?`,
        draft: 'I have a question about my order.',
        reply: 'Of course — tell me a little more and I’ll take it from here.',
      };
  }
}

export function buildSupportContext(
  facts: SupportFacts,
  topic: TopicId,
  now: number,
): SupportContextView {
  const byTopic = <T>(fn: (t: TopicId) => T) =>
    Object.fromEntries(TOPIC_ORDER.map((t) => [t, fn(t)])) as Record<TopicId, T>;
  return {
    orderId: facts.orderId,
    topic,
    topics: TOPIC_ORDER.map((id) => ({ id, label: TOPIC_LABEL[id] })),
    availability: supportAvailability(now),
    phoneHref: `tel:${SUPPORT_PHONE}`,
    phoneLabel: SUPPORT_PHONE_DISPLAY,
    emailLabel: SUPPORT_EMAIL,
    emailHrefByTopic: byTopic((t) => mailtoHref(facts, t)),
    chatByTopic: byTopic((t) => chatScript(facts, t)),
    agentName: SUPPORT_AGENT,
    teamName: SUPPORT_TEAM,
  };
}
