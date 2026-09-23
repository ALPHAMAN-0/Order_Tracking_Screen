import { atDhaka, MINUTE, toIso } from '@/features/order-tracking/domain/time';
import type {
  Carrier,
  EtaWindow,
  Order,
  PodPlacement,
  TrackingEvent,
} from '@/features/order-tracking/domain/types';
import type { WindowFixture } from './relative-time';

export interface OrderFixture extends Omit<
  Order,
  'placedAt' | 'promisedWindow' | 'shipment' | 'events'
> {
  placedAgoMin: number;
  promised: WindowFixture;
  shipment: null | {
    carrier: Carrier;
    trackingNumber: string;
    revised?: WindowFixture;
    pod?: { agoMin: number; placement: PodPlacement; receivedBy?: string; photoAlt: string };
  };
  events: (Omit<TrackingEvent, 'at'> & { agoMin: number })[];
}

function resolveWindow(w: WindowFixture, now: number): EtaWindow {
  return {
    start: toIso(atDhaka(w.from.day, w.from.at, now)),
    end: toIso(atDhaka(w.to.day, w.to.at, now)),
  };
}

/** Pure: turns a relative fixture into an API-shaped order as of `now`. */
export function resolveOrderFixture(fixture: OrderFixture, now: number): Order {
  const { placedAgoMin, promised, shipment, events, ...rest } = fixture;
  const minutesAgo = (m: number) => toIso(now - m * MINUTE);
  return {
    ...rest,
    placedAt: minutesAgo(placedAgoMin),
    promisedWindow: resolveWindow(promised, now),
    shipment: shipment && {
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
      ...(shipment.revised ? { revisedWindow: resolveWindow(shipment.revised, now) } : {}),
      ...(shipment.pod
        ? {
            proofOfDelivery: {
              at: minutesAgo(shipment.pod.agoMin),
              placement: shipment.pod.placement,
              photoAlt: shipment.pod.photoAlt,
              ...(shipment.pod.receivedBy ? { receivedBy: shipment.pod.receivedBy } : {}),
            },
          }
        : {}),
    },
    events: events.map(({ agoMin, ...event }) => ({ ...event, at: minutesAgo(agoMin) })),
  };
}
