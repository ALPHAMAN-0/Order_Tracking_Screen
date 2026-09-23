import { Skeleton } from '@/components/ui/Skeleton';

export function OrdersListSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-3">
      <span className="sr-only">Loading your orders…</span>
      <Skeleton className="mt-2 h-4 w-24" />
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-card"
        >
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
            <Skeleton className="mt-3 h-6 w-28 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
