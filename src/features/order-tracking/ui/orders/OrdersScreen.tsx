'use client';

import { useSearchParams } from 'next/navigation';
import { useOrdersList } from '@/features/order-tracking/hooks/useOrdersList';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';
import { OrdersListSkeleton } from '../states/OrdersListSkeleton';
import type { OrderListItemView } from '@/features/order-tracking/domain/view-model';
import { OrderListItem } from './OrderListItem';

function Group({ id, title, items }: { id: string; title: string; items: OrderListItemView[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-2 text-[13px] font-semibold tracking-wide text-fg-muted uppercase">
        {title}
      </h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <OrderListItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export function OrdersScreen() {
  const simulate = useSearchParams().get('simulate');
  return <OrdersScreenInner key={simulate ?? ''} simulate={simulate} />;
}

function OrdersScreenInner({ simulate }: { simulate: string | null }) {
  const { view, inProgress, delivered, retry } = useOrdersList(simulate);
  if (view === 'loading') return <OrdersListSkeleton />;
  if (view === 'error')
    return (
      <ErrorState
        title="We couldn’t load your orders"
        body="Check your connection and try again."
        onRetry={retry}
      />
    );
  if (view === 'empty') return <EmptyState />;
  return (
    <div className="flex flex-col gap-6">
      <Group id="in-progress" title="In progress" items={inProgress} />
      <Group id="delivered" title="Delivered" items={delivered} />
    </div>
  );
}
