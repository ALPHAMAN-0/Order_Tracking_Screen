/**
 * Raw, API-shaped order data. Only the domain layer reads these types;
 * UI components receive a derived `TrackingViewModel` instead (R3).
 */

export const MILESTONES = [
  'placed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const;
export type Milestone = (typeof MILESTONES)[number];

/** ISO-8601 UTC timestamp, as an API would send it. */
export type IsoDateTime = string;

/** Whole taka. Mock totals stay below ৳1,00,000 so lakh grouping never appears. */
export interface Money {
  amount: number;
  currency: 'BDT';
}

export type ProductCategory = 'electronics' | 'fashion' | 'home' | 'beauty' | 'grocery';

export interface LineItem {
  id: string;
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: Money;
  category: ProductCategory;
}

export interface Address {
  recipient: string;
  /** E.164, e.g. +8801712345621 */
  phone: string;
  line1: string;
  area: string;
  city: 'Dhaka' | 'Chattogram';
  postcode: string;
}

export type PaymentMethod =
  { type: 'card'; last4: string } | { type: 'mobile_wallet'; last2: string } | { type: 'cod' };

export interface Carrier {
  id: string;
  name: string;
  phone: string;
}

export interface EtaWindow {
  start: IsoDateTime;
  end: IsoDateTime;
}

export type ExceptionCode =
  'weather' | 'hub_backlog' | 'transport_disruption' | 'failed_attempt' | 'address_issue';

export interface TrackingEvent {
  id: string;
  at: IsoDateTime;
  source: 'merchant' | 'carrier';
  /** Absent = informational scan (e.g. "Arrived at hub"). */
  milestone?: Milestone;
  exception?: ExceptionCode;
  location?: string;
  message: string;
}

export type PodPlacement =
  'front_door' | 'reception' | 'handed_to_recipient' | 'handed_to_household';

export interface ProofOfDelivery {
  at: IsoDateTime;
  placement: PodPlacement;
  receivedBy?: string;
  photoAlt: string;
}

export interface Shipment {
  carrier: Carrier;
  trackingNumber: string;
  /** Carrier-revised estimate, when it differs from the checkout promise. */
  revisedWindow?: EtaWindow;
  proofOfDelivery?: ProofOfDelivery;
}

export interface Order {
  id: string;
  placedAt: IsoDateTime;
  customerFirstName: string;
  items: LineItem[];
  pricing: { subtotal: Money; deliveryFee: Money; discount: Money; total: Money };
  payment: PaymentMethod;
  shippingAddress: Address;
  /** Order-level estimate shown at checkout. */
  promisedWindow: EtaWindow;
  /** null = not handed to the carrier yet (tracking not available). */
  shipment: Shipment | null;
  /** Merchant + carrier events, in any order. */
  events: TrackingEvent[];
}

/* ---------- Customer-side facts (persisted per order on the device) ---------- */

export type MissingReason = 'nothing_delivered' | 'wrong_address' | 'damaged_or_empty' | 'other';

export interface SupportCase {
  id: string;
  kind: 'missing_package';
  reason: MissingReason;
  note?: string;
  openedAt: IsoDateTime;
  nextUpdateBy: IsoDateTime;
}

export interface CancellationRequest {
  id: string;
  requestedAt: IsoDateTime;
  /** null for cash on delivery — nothing was charged. */
  refund: Money | null;
}

export interface OrderClientState {
  v: 1;
  case?: SupportCase;
  cancellation?: CancellationRequest;
  notify: { changes: boolean; trackingLive: boolean };
}

export const EMPTY_CLIENT_STATE: OrderClientState = {
  v: 1,
  notify: { changes: false, trackingLive: false },
};
