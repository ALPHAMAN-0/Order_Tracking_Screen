import { ShoppingBag } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { StateMessage } from '@/components/ui/StateMessage';

export function EmptyState() {
  return (
    <StateMessage
      icon={ShoppingBag}
      tone="neutral"
      title="No orders yet"
      body="When you place an order, you’ll be able to track it here — every step from packing to your door."
      actions={<ButtonLink href="/">Browse the demo orders</ButtonLink>}
    />
  );
}
