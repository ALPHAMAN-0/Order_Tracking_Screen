import { Skeleton } from '@/components/ui/Skeleton';

/** Same footprint as the real screen so content doesn't jump in. */
export function TrackingSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Loading your order…</span>
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="mt-4 h-8 w-3/4" />
        <Skeleton className="mt-2 h-4 w-full" />
        <div className="mt-5 grid grid-cols-5 gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-1.5 rounded-full" />
          ))}
        </div>
        <Skeleton className="mt-4 h-20 w-full rounded-xl" />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="mt-5 flex gap-3">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
