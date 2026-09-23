'use client';

import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/cn';

export interface RadioOption<T extends string> {
  id: T;
  label: string;
  description?: string;
}

export function RadioCardGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  error,
}: {
  legend: string;
  name: string;
  options: RadioOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
}) {
  const errorId = useId();
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);

  // Focus the group once the error has rendered, so it's read with the field.
  useEffect(() => {
    if (error) fieldsetRef.current?.focus();
  }, [error]);

  return (
    <fieldset
      ref={fieldsetRef}
      tabIndex={-1}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className="outline-none"
    >
      <legend className="mb-2 text-[15px] font-semibold text-fg">{legend}</legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={cn(
              'flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border bg-surface p-3 transition-colors',
              'has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
              error ? 'border-danger-border' : 'border-border',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="mt-0.5 size-5 shrink-0 accent-(--brand) focus-visible:outline-none"
            />
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-fg">{option.label}</span>
              {option.description && (
                <span className="mt-0.5 block text-sm text-fg-muted">{option.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
