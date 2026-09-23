'use client';

import { useId } from 'react';

export function Textarea({
  label,
  hint,
  value,
  onChange,
  maxLength = 500,
  rows = 3,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  rows?: number;
}) {
  const id = useId();
  const hintId = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] font-semibold text-fg">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-0.5 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        aria-describedby={hint ? hintId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full resize-none rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-base text-fg placeholder:text-fg-subtle"
      />
      <p className="mt-1 text-right text-xs text-fg-subtle" aria-hidden>
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
