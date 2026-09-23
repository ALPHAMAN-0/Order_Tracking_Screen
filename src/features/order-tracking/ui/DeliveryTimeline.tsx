'use client';

import { Check, ChevronDown, Copy, TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { TONE_SOFT, TONE_SOLID_BG, TONE_SOLID_BORDER, TONE_TEXT } from '@/components/ui/tones';
import type {
  TimelineStepView,
  TrackingViewModel,
} from '@/features/order-tracking/domain/view-model';
import { cn } from '@/lib/cn';

const STATE_LABEL: Record<TimelineStepView['state'], string> = {
  complete: 'Completed',
  current: 'Current step',
  upcoming: 'Upcoming',
};

function Marker({ step }: { step: TimelineStepView }) {
  if (step.marker === 'done') {
    return (
      <span
        aria-hidden
        className={cn(
          'relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white dark:text-bg',
          TONE_SOLID_BG[step.tone],
        )}
      >
        <Check className="size-4" strokeWidth={3} />
      </span>
    );
  }
  if (step.marker === 'active') {
    return (
      <span
        aria-hidden
        className={cn(
          'relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-surface',
          TONE_SOLID_BORDER[step.tone],
        )}
      >
        <span
          className={cn(
            'absolute size-3 rounded-full opacity-60 motion-safe:animate-ping',
            TONE_SOLID_BG[step.tone],
          )}
        />
        <span className={cn('relative size-3 rounded-full', TONE_SOLID_BG[step.tone])} />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="relative z-10 inline-flex size-7 shrink-0 rounded-full border-2 border-border-strong bg-surface"
    />
  );
}

export function DeliveryTimeline({ timeline }: { timeline: TrackingViewModel['timeline'] }) {
  const toast = useToast();
  const [showHistory, setShowHistory] = useState(false);
  const historyId = useId();
  const { steps, carrier, lastUpdated, history } = timeline;

  async function copyTracking() {
    if (!carrier) return;
    try {
      await navigator.clipboard.writeText(carrier.trackingNumber);
      toast('Tracking number copied.');
    } catch {
      toast(`Tracking number: ${carrier.trackingNumber}`);
    }
  }

  return (
    <section
      aria-labelledby="timeline-title"
      className="rounded-2xl border border-border bg-surface p-4 shadow-card"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="timeline-title" className="text-[15px] font-semibold text-fg">
          Delivery progress
        </h2>
        {lastUpdated && <p className="text-[13px] text-fg-muted">{lastUpdated}</p>}
      </div>

      {carrier && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-surface-2 py-1.5 pr-1.5 pl-3">
          <div className="min-w-0">
            <p className="text-xs text-fg-muted">{carrier.name} tracking number</p>
            <p className="font-mono text-sm font-medium break-all text-fg">
              {carrier.trackingNumber}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyTracking}
            aria-label="Copy tracking number"
          >
            <Copy aria-hidden />
            Copy
          </Button>
        </div>
      )}

      <ol aria-label="Delivery steps" className="mt-4">
        {steps.map((step, i) => {
          const next = steps[i + 1];
          const reached = next && next.state !== 'upcoming';
          return (
            <li
              key={step.key}
              aria-current={step.state === 'current' ? 'step' : undefined}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {next && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-7 bottom-0 left-[13px] w-0.5',
                    reached ? TONE_SOLID_BG.success : 'bg-border',
                  )}
                />
              )}
              <Marker step={step} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    'text-[15px] leading-snug',
                    step.state === 'upcoming'
                      ? 'font-medium text-fg-muted'
                      : 'font-semibold text-fg',
                  )}
                >
                  <span className="sr-only">{STATE_LABEL[step.state]}: </span>
                  {step.label}
                </p>
                {step.time && (
                  <p className="text-[13px] text-fg-muted">
                    <time dateTime={step.dateTime}>{step.time}</time>
                  </p>
                )}
                {step.detail && <p className="mt-0.5 text-sm text-fg-muted">{step.detail}</p>}
                {step.note && (
                  <p
                    className={cn(
                      'mt-1.5 inline-flex items-start gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium',
                      TONE_SOFT[step.note.tone],
                      TONE_TEXT[step.note.tone],
                    )}
                  >
                    <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
                    {step.note.text}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {history.length > 0 && (
        <div className="mt-4 border-t border-border pt-2">
          <button
            type="button"
            aria-expanded={showHistory}
            aria-controls={historyId}
            onClick={() => setShowHistory((v) => !v)}
            className="flex min-h-11 w-full items-center justify-between rounded-xl text-sm font-semibold text-brand-text"
          >
            {showHistory ? 'Hide all updates' : `See all updates (${history.length})`}
            <ChevronDown
              aria-hidden
              className={cn(
                'size-4 transition-transform motion-reduce:transition-none',
                showHistory && 'rotate-180',
              )}
            />
          </button>
          {showHistory && (
            <ul id={historyId} className="mt-1 space-y-3">
              {history.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      entry.isException ? TONE_SOLID_BG.warning : 'bg-border-strong',
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">{entry.message}</p>
                    <p className="text-[13px] text-fg-muted">
                      <time dateTime={entry.dateTime}>{entry.when}</time>
                      {entry.location && ` · ${entry.location}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
