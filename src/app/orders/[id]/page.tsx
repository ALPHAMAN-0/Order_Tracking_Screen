import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SCENARIOS } from '@/features/order-tracking/data/scenarios';
import { TrackingHeader } from '@/features/order-tracking/ui/TrackingHeader';
import { TrackingScreen } from '@/features/order-tracking/ui/TrackingScreen';
import { TrackingSkeleton } from '@/features/order-tracking/ui/states/TrackingSkeleton';

// Every known order is prerendered; anything else is a real HTTP 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SCENARIOS.map((s) => ({ id: s.orderId }));
}

export async function generateMetadata({ params }: PageProps<'/orders/[id]'>): Promise<Metadata> {
  const { id } = await params;
  return { title: `Track order #${id}` };
}

export default async function OrderPage({ params }: PageProps<'/orders/[id]'>) {
  const { id } = await params;
  // The server renders a time-free shell; the client resolves "now"-relative data.
  return (
    <Suspense
      fallback={
        <>
          <TrackingHeader orderId={id} />
          <div className="pt-2">
            <TrackingSkeleton />
          </div>
        </>
      }
    >
      <TrackingScreen orderId={id} />
    </Suspense>
  );
}
