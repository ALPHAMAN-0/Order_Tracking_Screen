/** Mirrors src/features/order-tracking/data/scenarios.ts for e2e loops. */
export const SCENARIOS = [
  { id: 'SW-40211', headline: 'Arriving tomorrow', pill: 'On track', primary: null },
  { id: 'SW-39870', headline: 'Running late', pill: 'Delayed', primary: 'Ask about this delay' },
  {
    id: 'SW-39215',
    headline: '5 days late',
    pill: 'Significantly delayed',
    primary: 'Request refund or cancel',
  },
  {
    id: 'SW-40107',
    headline: /^Delivered (today|yesterday)$/,
    pill: 'Delivered',
    primary: 'I didn’t receive it',
  },
  { id: 'SW-40290', headline: 'Preparing your order', pill: 'Preparing', primary: null },
  { id: 'SW-38754', headline: /^Delivered /, pill: 'Delivered', primary: null },
] as const;
