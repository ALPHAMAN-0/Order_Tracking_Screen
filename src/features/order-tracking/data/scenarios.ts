/**
 * Scenario registry — time-free and server-safe. The single source for the
 * demo switcher, static route params, the README table and the e2e loops.
 */

export type BriefCase = 'delayed' | 'delivered_not_received' | 'tracking_unavailable' | null;

export interface Scenario {
  key: string;
  orderId: string;
  label: string;
  description: string;
  /** Which of the brief's three required situations this demonstrates. */
  brief: BriefCase;
}

export const SCENARIOS: readonly Scenario[] = [
  {
    key: 'on-track',
    orderId: 'SW-40211',
    label: 'On track',
    description: 'Baseline · shipped, arriving tomorrow',
    brief: null,
  },
  {
    key: 'running-late',
    orderId: 'SW-39870',
    label: 'Running late',
    description: 'Original date passed · new estimate (amber)',
    brief: 'delayed',
  },
  {
    key: 'significantly-delayed',
    orderId: 'SW-39215',
    label: 'Significantly delayed',
    description: '5 days late · refund or cancel (red)',
    brief: 'delayed',
  },
  {
    key: 'not-received',
    orderId: 'SW-40107',
    label: 'Delivered, not received',
    description: 'Proof of delivery · report missing parcel',
    brief: 'delivered_not_received',
  },
  {
    key: 'tracking-pending',
    orderId: 'SW-40290',
    label: 'Tracking not available yet',
    description: 'Order confirmed · no carrier scan yet',
    brief: 'tracking_unavailable',
  },
  {
    key: 'delivered',
    orderId: 'SW-38754',
    label: 'Delivered',
    description: 'Baseline · delivered 4 days ago',
    brief: null,
  },
];

export function orderExists(orderId: string): boolean {
  return SCENARIOS.some((s) => s.orderId === orderId);
}
