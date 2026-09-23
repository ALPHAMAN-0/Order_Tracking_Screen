import { CalendarClock } from 'lucide-react';
import { TONE_SOFT, TONE_TEXT } from '@/components/ui/tones';
import type { EtaView } from '@/features/order-tracking/domain/view-model';
import { cn } from '@/lib/cn';

/** Estimated (or actual) delivery. Visual layout + one screen-reader sentence. */
export function EtaCard({ eta }: { eta: EtaView }) {
  return (
    <div className="mt-4 rounded-xl bg-surface-2 p-3">
      <p className="sr-only">{eta.a11y}</p>
      <div aria-hidden className="flex gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-fg-muted">
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-fg-muted">{eta.label}</p>
          <p className="text-[17px] leading-snug font-semibold text-fg">{eta.value}</p>
          {eta.window && <p className="text-sm text-fg-muted">{eta.window}</p>}
          {(eta.was || eta.note) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              {eta.was && <del className="text-sm text-fg-subtle">{eta.was}</del>}
              {eta.note && (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-xs font-semibold',
                    TONE_SOFT[eta.note.tone],
                    TONE_TEXT[eta.note.tone],
                  )}
                >
                  {eta.note.text}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
