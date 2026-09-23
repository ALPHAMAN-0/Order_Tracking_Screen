import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ProductThumb } from '@/components/ui/ProductThumb';
import { StatusPill } from '@/components/ui/StatusPill';
import type { OrderListItemView } from '@/features/order-tracking/domain/view-model';
import { STATUS_ICON } from '../tone';

export function OrderListItem({ item }: { item: OrderListItemView }) {
  return (
    <li>
      <Link
        href={item.href}
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-card transition-colors hover:border-border-strong"
      >
        <ProductThumb category={item.category} />
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 gap-1 text-[15px] font-semibold text-fg">
            <span className="truncate">{item.title}</span>
            {item.titleMore && (
              <span className="shrink-0 font-medium text-fg-muted">{item.titleMore}</span>
            )}
          </p>
          <p className="flex flex-wrap gap-x-1.5 text-[13px] text-fg-muted">
            <span>{item.orderRef}</span>
            <span aria-hidden>·</span>
            <span className="whitespace-nowrap">{item.placedLabel}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <StatusPill tone={item.tone} icon={STATUS_ICON[item.status]}>
              {item.chip}
            </StatusPill>
            <span className="shrink-0 text-sm font-semibold text-fg">{item.totalLabel}</span>
          </div>
          <p className="mt-1 text-[13px] text-fg-muted">{item.statusLine}</p>
        </div>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-fg-subtle" />
      </Link>
    </li>
  );
}
