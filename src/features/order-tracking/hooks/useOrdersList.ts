'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { clientStateKey, parseClientState, parseSimulation } from '@/features/order-tracking/data';
import { deriveTrackingView } from '@/features/order-tracking/domain/derive-tracking-view';
import type { OrderListItemView } from '@/features/order-tracking/domain/view-model';
import { useNow } from '@/lib/hooks/useNow';
import { readItem, subscribe } from '@/lib/storage';
import { useOrderRepository } from './repository-context';
import { useRequest } from './useRequest';

const SEP = '␞';

/** "My orders": list items derived with the same view model as the tracking screen. */
export function useOrdersList(simulateParam: string | null): {
  view: 'loading' | 'error' | 'empty' | 'ready';
  inProgress: OrderListItemView[];
  delivered: OrderListItemView[];
  retry: () => void;
} {
  const repo = useOrderRepository();
  const simulate = parseSimulation(simulateParam);
  const { state, retry } = useRequest((o) => repo.listOrders({ ...o, simulate }), [repo, simulate]);
  const now = useNow();
  const orders = useMemo(() => (state.status === 'success' ? state.data : []), [state]);

  // One stable string snapshot of every order's stored customer state.
  const ids = orders.map((o) => o.id).join(SEP);
  const getSnapshot = useCallback(
    () =>
      ids
        .split(SEP)
        .map((id) => (id ? (readItem(clientStateKey(id)) ?? '') : ''))
        .join(SEP),
    [ids],
  );
  const rawStates = useSyncExternalStore(subscribe, getSnapshot, () => '');

  const items = useMemo(() => {
    if (now === null) return [];
    const raws = rawStates.split(SEP);
    return orders.map(
      (order, i) =>
        deriveTrackingView({ order, now, clientState: parseClientState(raws[i] || null) }).listItem,
    );
  }, [orders, now, rawStates]);

  let view: 'loading' | 'error' | 'empty' | 'ready';
  if (state.status === 'loading' || (state.status === 'success' && now === null)) view = 'loading';
  else if (state.status === 'error') view = 'error';
  else view = orders.length === 0 ? 'empty' : 'ready';

  return {
    view,
    inProgress: items.filter((i) => i.group === 'in_progress'),
    delivered: items.filter((i) => i.group === 'delivered'),
    retry,
  };
}
