/**
 * The presentation contract between the domain and the UI (R3).
 * Every string here is final, formatted copy; components only lay it out.
 */

export type Tone = 'success' | 'warning' | 'danger' | 'neutral';

export type TrackingStatus =
  'preparing' | 'on_track' | 'late' | 'severely_late' | 'delivered' | 'investigating';

export type ActionId = 'contact_support' | 'report_missing' | 'request_refund_or_cancel';
export type ToggleId = 'notify_changes' | 'notify_tracking_live';
export type TopicId =
  'where_is_order' | 'delayed' | 'not_received' | 'cancel_refund' | 'change_address' | 'other';
export type ProductCategory = 'electronics' | 'fashion' | 'home' | 'beauty' | 'grocery';
export type MissingReasonId = 'nothing_delivered' | 'wrong_address' | 'damaged_or_empty' | 'other';
export type StepKey = 'placed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered';

export interface ActionView {
  id: ActionId;
  label: string;
  emphasis: 'primary' | 'secondary' | 'danger';
}

export interface ToggleView {
  id: ToggleId;
  label: string;
  description: string;
  checked: boolean;
  /** Toast shown after switching on. */
  confirmation: string;
}

export interface NoteView {
  tone: Tone;
  text: string;
}

export interface TimelineStepView {
  key: StepKey;
  label: string;
  state: 'complete' | 'current' | 'upcoming';
  /** How the dot is drawn: a check, a live pulse, or an empty ring. */
  marker: 'done' | 'active' | 'todo';
  tone: Tone;
  time?: string;
  dateTime?: string;
  detail?: string;
  note?: NoteView;
}

export interface HistoryEntryView {
  id: string;
  when: string;
  dateTime: string;
  message: string;
  location?: string;
  isException: boolean;
}

export interface EtaView {
  label: string;
  value: string;
  window?: string;
  /** Original date, rendered struck through. */
  was?: string;
  note?: NoteView;
  a11y: string;
}

export interface HeroView {
  pill: string;
  headline: string;
  subline: string;
}

export interface DelayView {
  tone: Tone;
  title: string;
  delayLabel: string;
  reason: string;
  reassurance: string;
  toggle: ToggleView;
}

export interface PendingView {
  title: string;
  body: string;
  expectation: string;
  toggle: ToggleView;
  stale?: { title: string; body: string };
}

export interface ProofOfDeliveryView {
  deliveredLabel: string;
  placementLabel: string;
  receivedBy?: string;
  maskedAddress: string;
  photoAlt: string;
  /** Low-key "Report a problem" link when the prominent action has lapsed. */
  reportLink?: ActionView;
}

export interface CaseBannerView {
  caseId: string;
  title: string;
  body: string;
  nextUpdateLabel: string;
  steps: string[];
}

export interface CancellationBannerView {
  refId: string;
  title: string;
  body: string;
}

export interface ChatScript {
  opening: string;
  draft: string;
  reply: string;
}

export interface SupportContextView {
  orderId: string;
  topic: TopicId;
  topics: { id: TopicId; label: string }[];
  availability: { open: boolean; label: string };
  phoneHref: string;
  phoneLabel: string;
  emailLabel: string;
  emailHrefByTopic: Record<TopicId, string>;
  chatByTopic: Record<TopicId, ChatScript>;
  agentName: string;
  teamName: string;
}

export interface ItemView {
  id: string;
  name: string;
  variant?: string;
  quantityLabel: string;
  priceLabel: string;
  category: ProductCategory;
}

export interface OrderSummaryView {
  title: string;
  countLabel: string;
  totalLabel: string;
  items: ItemView[];
  moreLabel?: string;
}

export interface OrderDetailsView {
  orderId: string;
  placedLabel: string;
  items: ItemView[];
  rows: { label: string; value: string; tone?: Tone }[];
  totalLabel: string;
  paymentLabel: string;
  address: { recipient: string; phone: string; lines: string[] };
  carrier?: { name: string; trackingNumber: string };
}

export interface OrderListItemView {
  id: string;
  href: string;
  title: string;
  meta: string;
  status: TrackingStatus;
  tone: Tone;
  chip: string;
  statusLine: string;
  totalLabel: string;
  category: ProductCategory;
  group: 'in_progress' | 'delivered';
}

export interface MissingFlowView {
  orderId: string;
  deliveredLabel: string;
  placementLabel: string;
  waitUntilLabel: string;
  suggestWaiting: boolean;
  checklist: string[];
  reasons: { id: MissingReasonId; label: string; description: string }[];
  nextSteps: string[];
}

export interface RefundFlowView {
  delayLabel: string;
  isCod: boolean;
  cancelLabel: string;
  cancelDescription: string;
  keepLabel: string;
  keepDescription: string;
  outcome: { title: string; body: string };
}

export interface TrackingViewModel {
  orderId: string;
  status: TrackingStatus;
  tone: Tone;
  hero: HeroView;
  eta: EtaView;
  progress: { current: number; total: number; label: string };
  timeline: {
    steps: TimelineStepView[];
    carrier?: { name: string; trackingNumber: string };
    lastUpdated?: string;
    history: HistoryEntryView[];
  };
  delay?: DelayView;
  pending?: PendingView;
  proofOfDelivery?: ProofOfDeliveryView;
  caseBanner?: CaseBannerView;
  cancellationBanner?: CancellationBannerView;
  primaryAction?: ActionView;
  secondaryAction?: ActionView;
  support: SupportContextView;
  summary: OrderSummaryView;
  details: OrderDetailsView;
  missingFlow?: MissingFlowView;
  refundFlow?: RefundFlowView;
  listItem: OrderListItemView;
}
