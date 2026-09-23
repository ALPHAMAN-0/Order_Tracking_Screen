'use client';

import { FlaskConical, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DEMO_ENABLED, SCENARIOS, resetAllClientState } from '@/features/order-tracking/data';
import { cn } from '@/lib/cn';

const BRIEF_LABEL = {
  delayed: 'Brief: delayed order',
  delivered_not_received: 'Brief: delivered, not received',
  tracking_unavailable: 'Brief: tracking not available',
} as const;

/**
 * Evaluator-only control panel — not part of the product UI.
 * Jumps between scenarios and forces loading / error / not-found / empty states.
 */
export function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toast = useToast();
  if (!DEMO_ENABLED) return null;

  const currentOrder = pathname.startsWith('/orders/')
    ? pathname
    : `/orders/${SCENARIOS[0]?.orderId}`;
  const close = () => setOpen(false);
  const linkCls =
    'flex min-h-11 w-full flex-col justify-center rounded-xl border px-3 py-2 text-left hover:bg-surface-2';

  const states = [
    { label: 'Loading', href: `${currentOrder}?simulate=loading` },
    { label: 'Error (retry works)', href: `${currentOrder}?simulate=error` },
    { label: 'Order not found (404)', href: '/orders/SW-00000' },
    { label: 'Empty order list', href: '/?simulate=empty' },
  ];

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] justify-end px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          data-demo-switcher
          onClick={() => setOpen(true)}
          className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-4 text-sm font-semibold text-bg shadow-sheet"
        >
          <FlaskConical aria-hidden className="size-4" />
          Demo
        </button>
      </div>
      <BottomSheet
        open={open}
        onClose={close}
        title="Demo scenarios"
        description="Reviewer controls — not part of the product UI."
      >
        <h3 className="text-sm font-semibold text-fg">Delivery situations</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {SCENARIOS.map((s) => {
            const href = `/orders/${s.orderId}`;
            const active = pathname === href;
            return (
              <li key={s.key}>
                <Link
                  href={href}
                  onClick={close}
                  aria-current={active ? 'page' : undefined}
                  className={cn(linkCls, active ? 'border-brand bg-brand-soft' : 'border-border')}
                >
                  <span className="text-[15px] font-semibold text-fg">{s.label}</span>
                  <span className="text-[13px] text-fg-muted">
                    {s.description}
                    {s.brief && (
                      <span className="font-medium text-brand-text"> · {BRIEF_LABEL[s.brief]}</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <h3 className="mt-5 text-sm font-semibold text-fg">Screen states</h3>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {states.map((s) => (
            <li key={s.label}>
              <Link
                href={s.href}
                onClick={close}
                className={cn(linkCls, 'border-border text-sm font-medium text-fg')}
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>

        <Button
          variant="ghost"
          fullWidth
          className="mt-4"
          onClick={() => {
            resetAllClientState();
            toast('Demo data reset — reports, cancellations and alerts cleared.');
            close();
          }}
        >
          <RotateCcw aria-hidden />
          Reset demo data
        </Button>
      </BottomSheet>
    </>
  );
}
