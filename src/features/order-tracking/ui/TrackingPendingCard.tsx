import { PackageSearch } from 'lucide-react';
import type { PendingView, ToggleId } from '@/features/order-tracking/domain/view-model';
import { NotifyToggle } from './NotifyToggle';

/** "Tracking not available yet" — a confident waiting state, never an empty one. */
export function TrackingPendingCard({
  pending,
  onToggle,
}: {
  pending: PendingView;
  onToggle: (id: ToggleId, value: boolean) => void;
}) {
  return (
    <section
      aria-labelledby="pending-title"
      className="rounded-2xl border border-border bg-surface p-4 shadow-card"
    >
      <div className="flex gap-3">
        <span
          aria-hidden
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-soft text-neutral"
        >
          <PackageSearch className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="pending-title" className="text-[15px] font-semibold text-fg">
            {pending.title}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">{pending.body}</p>
        </div>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-fg">What happens next</h3>
      <ol className="mt-2 flex flex-col gap-2">
        {pending.nextSteps.map((step, i) => (
          <li key={step} className="flex gap-2.5 text-sm text-fg">
            <span
              aria-hidden
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-soft text-xs font-semibold text-neutral"
            >
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <div className="mt-3 border-t border-border pt-1.5">
        <NotifyToggle toggle={pending.toggle} onToggle={onToggle} />
      </div>
    </section>
  );
}
