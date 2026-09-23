import { Suspense } from 'react';
import { OrdersScreen } from '@/features/order-tracking/ui/orders/OrdersScreen';
import { OrdersListSkeleton } from '@/features/order-tracking/ui/states/OrdersListSkeleton';

export default function HomePage() {
  return (
    <>
      <header className="pt-8 pb-5">
        <p className="text-sm font-semibold text-brand-text">Haatbox</p>
        <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-tight text-fg">
          My orders
        </h1>
        <p className="mt-1 text-[15px] text-fg-muted">
          Track deliveries and get help with any order.
        </p>
      </header>
      <main id="main">
        <Suspense fallback={<OrdersListSkeleton />}>
          <OrdersScreen />
        </Suspense>
      </main>
    </>
  );
}
