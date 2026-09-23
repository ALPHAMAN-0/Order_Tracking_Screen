import { ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductThumb } from '@/components/ui/ProductThumb';
import type { OrderSummaryView } from '@/features/order-tracking/domain/view-model';

export function OrderSummaryCard({
  summary,
  onViewDetails,
}: {
  summary: OrderSummaryView;
  onViewDetails: () => void;
}) {
  return (
    <section
      aria-labelledby="summary-title"
      className="rounded-2xl border border-border bg-surface p-4 shadow-card"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="summary-title" className="text-[15px] font-semibold text-fg">
          Your order
        </h2>
        <p className="text-sm text-fg-muted">
          {summary.countLabel} · <span className="font-semibold text-fg">{summary.totalLabel}</span>
        </p>
      </div>
      <ul className="mt-2 divide-y divide-border">
        {summary.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            <ProductThumb category={item.category} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-fg">{item.name}</p>
              <p className="truncate text-[13px] text-fg-muted">
                {item.variant ? `${item.variant} · ` : ''}
                {item.quantityLabel}
              </p>
            </div>
            <p className="text-sm font-medium text-fg">{item.priceLabel}</p>
          </li>
        ))}
      </ul>
      {summary.moreLabel && <p className="pb-1 text-sm text-fg-muted">{summary.moreLabel}</p>}
      <Button variant="secondary" fullWidth className="mt-2" onClick={onViewDetails}>
        <ReceiptText aria-hidden />
        View order details
      </Button>
    </section>
  );
}
