import type { ExceptionCode, Milestone, MissingReason, PodPlacement } from './types';
import type { TopicId, TrackingStatus } from './view-model';

/** Customer-language step names (the old UI showed raw system states). */
export const STEP_LABEL: Record<Milestone, string> = {
  placed: 'Order placed',
  processing: 'Preparing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

export const STATUS_PILL: Record<TrackingStatus, string> = {
  preparing: 'Preparing',
  on_track: 'On track',
  late: 'Delayed',
  severely_late: 'Significantly delayed',
  delivered: 'Delivered',
  investigating: 'Investigation open',
  cancelled: 'Cancelling',
};

export const PLACEMENT_LABEL: Record<PodPlacement, string> = {
  front_door: 'Left at front door',
  reception: 'Left with building reception',
  handed_to_recipient: 'Handed to you',
  handed_to_household: 'Handed to a household member',
};

export function delayReason(code: ExceptionCode, location?: string): string {
  const at = location ? ` at ${location}` : '';
  switch (code) {
    case 'weather':
      return `Heavy rain slowed deliveries${at}.`;
    case 'hub_backlog':
      return `A parcel backlog${at} is holding up deliveries.`;
    case 'transport_disruption':
      return `A transport disruption${at} delayed your parcel.`;
    case 'failed_attempt':
      return 'The rider couldn’t reach you on the last delivery attempt.';
    case 'address_issue':
      return 'The carrier needs to confirm your delivery address.';
  }
}

export function exceptionShort(code: ExceptionCode, location?: string): string {
  const at = location ? ` · ${location}` : '';
  switch (code) {
    case 'weather':
      return `Heavy rain${at}`;
    case 'hub_backlog':
      return `Hub backlog${at}`;
    case 'transport_disruption':
      return `Transport disruption${at}`;
    case 'failed_attempt':
      return 'Delivery attempt failed';
    case 'address_issue':
      return 'Address needs confirming';
  }
}

export const TOPIC_LABEL: Record<TopicId, string> = {
  where_is_order: 'Where is my order?',
  delayed: 'Delayed delivery',
  not_received: 'Marked delivered, not received',
  cancel_refund: 'Cancel or refund',
  change_address: 'Change delivery address',
  other: 'Something else',
};

export const MISSING_REASONS: { id: MissingReason; label: string; description: string }[] = [
  {
    id: 'nothing_delivered',
    label: 'Nothing arrived',
    description: 'No parcel at the door, reception or with neighbours',
  },
  {
    id: 'wrong_address',
    label: 'Delivered to the wrong place',
    description: 'The photo or location isn’t my address',
  },
  {
    id: 'damaged_or_empty',
    label: 'Parcel was damaged or empty',
    description: 'Something arrived, but not my items',
  },
  { id: 'other', label: 'Something else', description: 'Tell us what happened below' },
];
