import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TONE_SOFT, TONE_TEXT, type Tone } from './tones';

/** Shared layout for error, empty and not-found states. */
export function StateMessage({
  icon: Icon,
  tone = 'neutral',
  title,
  body,
  actions,
  role,
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  body: string;
  actions?: ReactNode;
  role?: 'alert' | 'status';
  className?: string;
}) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col items-center rounded-2xl border border-border bg-surface px-5 py-8 text-center shadow-card',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mb-4 inline-flex size-14 items-center justify-center rounded-full',
          TONE_SOFT[tone],
          TONE_TEXT[tone],
        )}
      >
        <Icon className="size-7" strokeWidth={1.75} />
      </span>
      <h2 className="text-lg font-semibold text-balance text-fg">{title}</h2>
      <p className="mt-1.5 max-w-[32ch] text-[15px] text-pretty text-fg-muted">{body}</p>
      {actions && <div className="mt-5 flex w-full flex-col gap-2">{actions}</div>}
    </div>
  );
}
