import { Clock, TriangleAlert } from 'lucide-react';
import { TONE_BORDER, TONE_SOFT, TONE_TEXT } from '@/components/ui/tones';
import type { DelayView, ToggleId } from '@/features/order-tracking/domain/view-model';
import { cn } from '@/lib/cn';
import { NotifyToggle } from './NotifyToggle';

export function DelayBanner({
  delay,
  onToggle,
}: {
  delay: DelayView;
  onToggle: (id: ToggleId, value: boolean) => void;
}) {
  const Icon = delay.tone === 'danger' ? TriangleAlert : Clock;
  return (
    <section
      aria-labelledby="delay-title"
      className={cn('rounded-2xl border p-4', TONE_SOFT[delay.tone], TONE_BORDER[delay.tone])}
    >
      <div className="flex gap-3">
        <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', TONE_TEXT[delay.tone])} />
        <div className="min-w-0">
          <h2 id="delay-title" className={cn('text-[15px] font-semibold', TONE_TEXT[delay.tone])}>
            {delay.title}
          </h2>
          <p className="mt-1 text-sm text-fg">{delay.reason}</p>
          <p className="mt-1 text-sm text-fg-muted">{delay.reassurance}</p>
        </div>
      </div>
      <div className={cn('mt-3 border-t pt-1.5', TONE_BORDER[delay.tone])}>
        <NotifyToggle toggle={delay.toggle} onToggle={onToggle} />
      </div>
    </section>
  );
}
