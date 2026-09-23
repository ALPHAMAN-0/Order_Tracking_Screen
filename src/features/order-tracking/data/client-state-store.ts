import { EMPTY_CLIENT_STATE, type OrderClientState } from '@/features/order-tracking/domain/types';
import { readItem, removeByPrefix, writeItem } from '@/lib/storage';

/*
 * Customer-side facts (reports, cancellations, notification toggles) persisted
 * per order on this device. Versioned so a future shape change can't crash
 * an evaluator who visited earlier.
 */

const PREFIX = 'haatbox:v1:order:';

export const clientStateKey = (orderId: string) => `${PREFIX}${orderId}`;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function parseClientState(raw: string | null): OrderClientState {
  if (!raw) return EMPTY_CLIENT_STATE;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.v !== 1) return EMPTY_CLIENT_STATE;
    const notify = isRecord(data.notify) ? data.notify : {};
    const state: OrderClientState = {
      v: 1,
      notify: { changes: notify.changes === true, trackingLive: notify.trackingLive === true },
    };
    if (isRecord(data.case) && typeof data.case.id === 'string') {
      state.case = data.case as unknown as OrderClientState['case'];
    }
    if (isRecord(data.cancellation) && typeof data.cancellation.id === 'string') {
      state.cancellation = data.cancellation as unknown as OrderClientState['cancellation'];
    }
    return state;
  } catch {
    return EMPTY_CLIENT_STATE;
  }
}

export function readClientState(orderId: string): OrderClientState {
  return parseClientState(readItem(clientStateKey(orderId)));
}

export function updateClientState(
  orderId: string,
  update: (current: OrderClientState) => OrderClientState,
): OrderClientState {
  const next = update(readClientState(orderId));
  writeItem(clientStateKey(orderId), JSON.stringify(next));
  return next;
}

/** Demo "Reset" — forget every report, cancellation and toggle. */
export function resetAllClientState(): void {
  removeByPrefix(PREFIX);
}
