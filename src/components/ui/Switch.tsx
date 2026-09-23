'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

/** A full-row switch: the whole row is the 44px+ tap target. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
}) {
  const labelId = useId();
  const descId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={description ? descId : undefined}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex min-h-11 w-full items-center justify-between gap-3 rounded-xl text-left',
        className,
      )}
    >
      <span className="min-w-0">
        <span id={labelId} className="block text-[15px] font-medium text-fg">
          {label}
        </span>
        {description && (
          <span id={descId} className="mt-0.5 block text-sm text-fg-muted">
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors motion-reduce:transition-none',
          checked ? 'bg-brand' : 'bg-border-strong',
        )}
      >
        <span
          className={cn(
            'inline-block size-6 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </span>
    </button>
  );
}
