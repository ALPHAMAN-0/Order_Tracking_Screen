import { StatusPill } from '@/components/ui/StatusPill';
import { TONE_SOLID_BG } from '@/components/ui/tones';
import type { TrackingViewModel } from '@/features/order-tracking/domain/view-model';
import { cn } from '@/lib/cn';
import { EtaCard } from './EtaCard';
import { STATUS_ICON } from './tone';

/** The at-a-glance answer: what's happening, when it arrives, how far along. */
export function StatusHero({ vm }: { vm: TrackingViewModel }) {
  const { hero, progress, tone, status } = vm;
  return (
    <section
      aria-labelledby="status-headline"
      className="rounded-2xl border border-border bg-surface p-5 shadow-card"
    >
      <StatusPill tone={tone} icon={STATUS_ICON[status]}>
        {hero.pill}
      </StatusPill>
      <h1
        id="status-headline"
        tabIndex={-1}
        className="mt-3 text-[26px] leading-tight font-bold tracking-tight text-balance text-fg outline-none"
      >
        {hero.headline}
      </h1>
      <p className="mt-1 text-[15px] text-pretty text-fg-muted">{hero.subline}</p>

      <div className="mt-4">
        <div aria-hidden className="grid grid-cols-5 gap-1">
          {Array.from({ length: progress.total }, (_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full',
                i < progress.current ? TONE_SOLID_BG[tone] : 'bg-border',
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-[13px] font-medium text-fg-muted">{progress.label}</p>
      </div>

      <EtaCard eta={vm.eta} />
    </section>
  );
}
