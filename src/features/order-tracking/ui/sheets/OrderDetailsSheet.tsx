'use client';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ProductThumb } from '@/components/ui/ProductThumb';
import { TONE_TEXT } from '@/components/ui/tones';
import type { OrderDetailsView } from '@/features/order-tracking/domain/view-model';
import { cn } from '@/lib/cn';

export function OrderDetailsSheet({
  open,
  onClose,
  details,
}: {
  open: boolean;
  onClose: () => void;
  details: OrderDetailsView;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Order details"
      description={`#${details.orderId} · ${details.placedLabel}`}
    >
      <h3 className="sr-only">Items</h3>
      <ul className="divide-y divide-border">
        {details.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <ProductThumb category={item.category} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-fg">{item.name}</p>
              <p className="text-[13px] text-fg-muted">
                {item.variant ? `${item.variant} · ` : ''}
                {item.quantityLabel}
              </p>
            </div>
            <p className="text-sm font-medium text-fg">{item.priceLabel}</p>
          </li>
        ))}
      </ul>

      <h3 className="mt-4 text-sm font-semibold text-fg">Payment summary</h3>
      <dl className="mt-2 space-y-1.5 rounded-xl bg-surface-2 p-3 text-sm">
        {details.rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3">
            <dt className="text-fg-muted">{row.label}</dt>
            <dd className={cn('font-medium text-fg', row.tone && TONE_TEXT[row.tone])}>
              {row.value}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-border pt-2 text-[15px]">
          <dt className="font-semibold text-fg">Total</dt>
          <dd className="font-semibold text-fg">{details.totalLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-fg-muted">Paid with</dt>
          <dd className="text-fg">{details.paymentLabel}</dd>
        </div>
      </dl>

      <h3 className="mt-4 text-sm font-semibold text-fg">Delivery address</h3>
      <address className="mt-2 rounded-xl bg-surface-2 p-3 text-sm text-fg not-italic">
        <span className="block font-medium">{details.address.recipient}</span>
        {details.address.lines.map((line) => (
          <span key={line} className="block text-fg-muted">
            {line}
          </span>
        ))}
        <span className="block text-fg-muted">{details.address.phone}</span>
      </address>

      {details.carrier && (
        <>
          <h3 className="mt-4 text-sm font-semibold text-fg">Carrier</h3>
          <p className="mt-2 rounded-xl bg-surface-2 p-3 text-sm text-fg">
            {details.carrier.name}
            <span className="block font-mono text-fg-muted">{details.carrier.trackingNumber}</span>
          </p>
        </>
      )}
    </BottomSheet>
  );
}
