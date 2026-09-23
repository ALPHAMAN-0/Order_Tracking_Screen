import { ChevronLeft, LifeBuoy } from 'lucide-react';
import Link from 'next/link';

/** Sticky app bar. `onHelp` is omitted in the server-rendered skeleton. */
export function TrackingHeader({ orderId, onHelp }: { orderId: string; onHelp?: () => void }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 flex h-14 items-center gap-1 bg-bg/85 px-2 backdrop-blur-md">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-0.5 rounded-xl pr-2 pl-1 text-[15px] font-medium text-brand-text hover:bg-brand-soft"
      >
        <ChevronLeft aria-hidden className="size-5" />
        Orders
      </Link>
      <p className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-fg">
        Order #{orderId}
      </p>
      <button
        type="button"
        onClick={onHelp}
        disabled={!onHelp}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[15px] font-medium text-brand-text hover:bg-brand-soft disabled:opacity-60"
      >
        <LifeBuoy aria-hidden className="size-[18px]" />
        Help
      </button>
    </header>
  );
}
