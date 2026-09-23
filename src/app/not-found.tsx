import type { Metadata } from 'next';
import { NotFoundState } from '@/features/order-tracking/ui/states/NotFoundState';

export const metadata: Metadata = { title: 'Order not found' };

export default function NotFound() {
  return (
    <main id="main" className="pt-16">
      <NotFoundState />
    </main>
  );
}
