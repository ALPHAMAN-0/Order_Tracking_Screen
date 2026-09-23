import type { LucideIcon } from 'lucide-react';
import type { Ref } from 'react';
import { TONE_BORDER, TONE_SOFT, TONE_TEXT, type Tone } from '@/components/ui/tones';
import { cn } from '@/lib/cn';

/** Investigation, cancellation and "taking longer than usual" notices. */
export function StatusBanner({
  tone,
  icon: Icon,
  title,
  body,
  meta,
  steps,
  headingRef,
}: {
  tone: Tone;
  icon: LucideIcon;
  title: string;
  body: string;
  meta?: string;
  steps?: string[];
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <section className={cn('rounded-2xl border p-4', TONE_SOFT[tone], TONE_BORDER[tone])}>
      <div className="flex gap-3">
        <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', TONE_TEXT[tone])} />
        <div className="min-w-0">
          <h2
            ref={headingRef}
            tabIndex={headingRef ? -1 : undefined}
            className={cn('text-[15px] font-semibold outline-none', TONE_TEXT[tone])}
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-fg">{body}</p>
          {meta && <p className="mt-1 text-sm font-medium text-fg">{meta}</p>}
          {steps && steps.length > 0 && (
            <ol className="mt-3 space-y-1.5">
              {steps.map((step, i) => (
                <li key={step} className="flex gap-2 text-sm text-fg-muted">
                  <span
                    aria-hidden
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-fg"
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
