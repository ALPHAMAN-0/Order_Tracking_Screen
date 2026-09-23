'use client';

import { ErrorState } from '@/features/order-tracking/ui/states/ErrorState';

export default function OrderError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="pt-16">
      <ErrorState
        title="Something went wrong"
        body="This page hit an unexpected problem. Try again — your order is unaffected."
        onRetry={retry}
      />
    </div>
  );
}
