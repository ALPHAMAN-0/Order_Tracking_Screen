'use client';

import { useMemo } from 'react';
import {
  clientStateKey,
  parseClientState,
  parseSimulation,
  updateClientState,
} from '@/features/order-tracking/data';
import { deriveTrackingView } from '@/features/order-tracking/domain/derive-tracking-view';
import {
  createCancellationRequest,
  createSupportCase,
} from '@/features/order-tracking/domain/flows';
import { buildSupportContext } from '@/features/order-tracking/domain/support';
import type {
  MissingReasonId,
  SupportContextView,
  ToggleId,
  TrackingViewModel,
} from '@/features/order-tracking/domain/view-model';
import { clock } from '@/lib/clock';
import { useNow } from '@/lib/hooks/useNow';
import { useStoredValue } from '@/lib/hooks/useStoredValue';
import { useOrderRepository } from './repository-context';
import { useRequest } from './useRequest';

export type ScreenView = 'loading' | 'error' | 'not_found' | 'ready';

export interface TrackingActions {
  setToggle: (id: ToggleId, value: boolean) => void;
  /** Files a missing-parcel report and returns its case reference. */
  reportMissing: (input: { reason: MissingReasonId; note?: string }) => string;
  /** Requests cancellation and returns its reference, or null if unavailable. */
  requestCancellation: () => string | null;
}

/**
 * Composes data + clock + customer state into the screen's view model.
 * The only hook the tracking UI talks to (R3).
 */
export function useTrackingScreen(
  orderId: string,
  simulateParam: string | null,
): {
  view: ScreenView;
  vm: TrackingViewModel | null;
  support: SupportContextView | null;
  retry: () => void;
  actions: TrackingActions;
} {
  const repo = useOrderRepository();
  const simulate = parseSimulation(simulateParam);
  const { state, retry } = useRequest(
    (options) => repo.getOrder(orderId, { ...options, simulate }),
    [repo, orderId, simulate],
  );
  const now = useNow();
  const raw = useStoredValue(clientStateKey(orderId));
  const clientState = useMemo(() => parseClientState(raw), [raw]);
  const order = state.status === 'success' ? state.data : null;

  const vm = useMemo(
    () => (order && now !== null ? deriveTrackingView({ order, now, clientState }) : null),
    [order, now, clientState],
  );

  const fallbackSupport = useMemo(
    () =>
      now === null
        ? null
        : buildSupportContext({ orderId, stage: 'unknown' }, 'where_is_order', now),
    [orderId, now],
  );

  const actions = useMemo<TrackingActions>(
    () => ({
      setToggle(id, value) {
        const field = id === 'notify_changes' ? 'changes' : 'trackingLive';
        updateClientState(orderId, (s) => ({ ...s, notify: { ...s.notify, [field]: value } }));
      },
      reportMissing(input) {
        const supportCase = createSupportCase(input, clock.now(), Math.random);
        updateClientState(orderId, (s) => ({ ...s, case: supportCase }));
        return supportCase.id;
      },
      requestCancellation() {
        if (!order) return null;
        const request = createCancellationRequest(order, clock.now(), Math.random);
        updateClientState(orderId, (s) => ({ ...s, cancellation: request }));
        return request.id;
      },
    }),
    [orderId, order],
  );

  let view: ScreenView;
  if (state.status === 'loading') view = 'loading';
  else if (state.status === 'error') view = 'error';
  else if (!order) view = 'not_found';
  else view = vm ? 'ready' : 'loading';

  return { view, vm, support: vm?.support ?? fallbackSupport, retry, actions };
}
