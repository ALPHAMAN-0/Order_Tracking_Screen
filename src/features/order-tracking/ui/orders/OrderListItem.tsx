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
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[15px] font-semibold text-fg">{item.title}</p>
            <p className="shrink-0 text-sm font-semibold text-fg">{item.totalLabel}</p>
          </div>
          <p className="text-[13px] text-fg-muted">{item.meta}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusPill tone={item.tone} icon={STATUS_ICON[item.status]}>
              {item.chip}
            </StatusPill>
            <span className="text-[13px] text-fg-muted">{item.statusLine}</span>
          </div>
        </div>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-fg-subtle" />
      </Link>
    </li>
  );
}
