import { PLACEMENT_LABEL, STEP_LABEL, exceptionShort } from './copy';
import { formatAgo, formatDateTime, formatDayPhrase } from './format';
import type { StatusFacts } from './status';
import { toMs } from './time';
import { MILESTONES, type Order, type OrderClientState, type TrackingEvent } from './types';
import type { Tone, TimelineStepView, TrackingStatus, TrackingViewModel } from './view-model';

function place(event: TrackingEvent): string {
  return event.location ? `${event.message} · ${event.location}` : event.message;
}

export function timelineView(
  order: Order,
  facts: StatusFacts,
  status: TrackingStatus,
  tone: Tone,
  clientState: OrderClientState,
  now: number,
): TrackingViewModel['timeline'] {
  const firstEventFor = (key: string) => facts.events.find((e) => e.milestone === key);

  const steps: TimelineStepView[] = MILESTONES.map((key, index) => {
    const state =
      index < facts.milestoneIndex
        ? 'complete'
        : index === facts.milestoneIndex
          ? 'current'
          : 'upcoming';
    const event = firstEventFor(key);
    const step: TimelineStepView = {
      key,
      label: STEP_LABEL[key],
      state,
      marker:
        state === 'complete' || (key === 'delivered' && facts.delivered)
          ? 'done'
          : state === 'current'
            ? 'active'
            : 'todo',
      tone:
        state === 'upcoming'
          ? 'neutral'
          : state === 'complete' || key === 'delivered'
            ? 'success'
            : tone,
    };
    if (event && state !== 'upcoming') {
      step.time = formatDateTime(toMs(event.at), now);
      step.dateTime = event.at;
    }

    if (state === 'complete' && event?.location) step.detail = event.location;

    if (state === 'current' && key !== 'delivered') {
      const exception = facts.severity !== 'none' ? facts.latestException : null;
      if (status === 'preparing' && key === 'processing') {
        step.detail = 'The seller is packing your order';
      } else if (facts.latestEvent && facts.latestEvent !== exception) {
        // The exception gets its own note below; don't say it twice.
        step.detail = place(facts.latestEvent);
      }
      if (exception?.exception) {
        step.note = { tone, text: exceptionShort(exception.exception, exception.location) };
      }
    }

    if (state === 'upcoming') {
      if (key === 'shipped' && !facts.trackingLive)
        step.detail = 'Waiting for the first carrier scan';
      if (key === 'delivered') {
        const noDate =
          facts.severity !== 'none' && (facts.revisedAlsoPassed || !order.shipment?.revisedWindow);
        step.detail = noDate
          ? 'New date to be confirmed'
          : `Expected ${formatDayPhrase(facts.expectedBy, now)}`;
      }
    }

    if (key === 'delivered' && facts.delivered) {
      const pod = order.shipment?.proofOfDelivery;
      if (pod) step.detail = PLACEMENT_LABEL[pod.placement];
      if (clientState.case) {
        step.tone = 'danger';
        step.note = {
          tone: 'danger',
          text: `You reported this as not received · ${clientState.case.id}`,
        };
      }
    }
    return step;
  });

  const history = [...facts.events].reverse().map((e) => ({
    id: e.id,
    when: formatDateTime(toMs(e.at), now),
    dateTime: e.at,
    message: e.message,
    ...(e.location ? { location: e.location } : {}),
    isException: !!e.exception,
  }));

  return {
    steps,
    ...(order.shipment
      ? {
          carrier: {
            name: order.shipment.carrier.name,
            trackingNumber: order.shipment.trackingNumber,
          },
        }
      : {}),
    ...(facts.latestEvent
      ? { lastUpdated: `Updated ${formatAgo(toMs(facts.latestEvent.at), now)}` }
      : {}),
    history,
  };
}
