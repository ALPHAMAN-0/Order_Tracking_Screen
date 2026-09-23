import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-fg shadow-card hover:bg-brand-hover active:bg-brand-hover',
  secondary:
    'border border-border-strong bg-surface text-fg hover:bg-surface-2 active:bg-surface-2',
  ghost: 'text-brand-text hover:bg-brand-soft active:bg-brand-soft',
};

const SIZES: Record<Size, string> = {
  md: 'min-h-11 px-4 text-[15px]',
  sm: 'min-h-11 px-3 text-sm',
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: StyleProps) {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = 'button',
  ref,
  ...props
}: StyleProps & ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

/** Internal routes use next/link; tel:, mailto: and external URLs use <a>. */
export function ButtonLink({
  href,
  variant,
  size,
  fullWidth,
  className,
  children,
  ...props
}: StyleProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  const cls = buttonClass({ variant, size, fullWidth, className });
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} {...props}>
      {children}
    </a>
  );
}
