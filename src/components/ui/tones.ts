/**
 * Tone → class maps. Static strings so Tailwind can see every class (R9);
 * never build `bg-${tone}` dynamically.
 */
export type Tone = 'success' | 'warning' | 'danger' | 'neutral';

export const TONE_TEXT: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-neutral',
};

export const TONE_SOFT: Record<Tone, string> = {
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  neutral: 'bg-neutral-soft',
};

export const TONE_BORDER: Record<Tone, string> = {
  success: 'border-success-border',
  warning: 'border-warning-border',
  danger: 'border-danger-border',
  neutral: 'border-neutral-border',
};

export const TONE_SOLID_BG: Record<Tone, string> = {
  success: 'bg-success-solid',
  warning: 'bg-warning-solid',
  danger: 'bg-danger-solid',
  neutral: 'bg-neutral-solid',
};

export const TONE_SOLID_BORDER: Record<Tone, string> = {
  success: 'border-success-solid',
  warning: 'border-warning-solid',
  danger: 'border-danger-solid',
  neutral: 'border-neutral-solid',
};
