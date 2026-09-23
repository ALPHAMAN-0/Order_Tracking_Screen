import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TONE_BORDER, TONE_SOFT, TONE_TEXT, type Tone } from './tones';

/** Status chip: colour + icon + text, so colour is never the only signal. */
export function StatusPill({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: Tone;
  icon: LucideIcon;
  children: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] leading-none font-semibold whitespace-nowrap',
        TONE_SOFT[tone],
        TONE_TEXT[tone],
        TONE_BORDER[tone],
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5 shrink-0" strokeWidth={2.5} />
      {children}
    </span>
  );
}
