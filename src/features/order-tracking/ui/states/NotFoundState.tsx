import { PackageSearch } from 'lucide-react';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { StateMessage } from '@/components/ui/StateMessage';

export function NotFoundState({
  orderId,
  extraAction,
}: {
  orderId?: string;
  extraAction?: ReactNode;
}) {
  return (
    <StateMessage
      icon={PackageSearch}
      tone="neutral"
      title="We can’t find that order"
      body={
        orderId
          ? `There’s no order #${orderId} on this account. Check the number, or pick it from your orders.`
          : 'This page doesn’t exist. Pick an order from your list instead.'
      }
      actions={
        <>
          <ButtonLink href="/">Go to my orders</ButtonLink>
          {extraAction}
        </>
      }
    />
  );
}
