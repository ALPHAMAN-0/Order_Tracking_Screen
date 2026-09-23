import { Headset, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { SupportContextView } from '@/features/order-tracking/domain/view-model';
import { cn } from '@/lib/cn';

export function SupportCard({
  support,
  onContact,
}: {
  support: SupportContextView;
  onContact: () => void;
}) {
  return (
    <section
      aria-labelledby="support-title"
      className="rounded-2xl border border-border bg-surface p-4 shadow-card"
    >
      <div className="flex gap-3">
        <span
          aria-hidden
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text"
        >
          <Headset className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="support-title" className="text-[15px] font-semibold text-fg">
            Need help with this order?
          </h2>
          <p className="mt-0.5 text-sm text-fg-muted">Chat, call or email {support.teamName}.</p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-fg-muted">
            <span
              aria-hidden
              className={cn(
                'size-2 shrink-0 rounded-full',
                support.availability.open ? 'bg-success-solid' : 'bg-neutral-solid',
              )}
            />
            Phone line · {support.availability.label}
          </p>
        </div>
      </div>
      <Button variant="secondary" fullWidth className="mt-3" onClick={onContact}>
        <MessageCircle aria-hidden />
        Contact support
      </Button>
    </section>
  );
}
