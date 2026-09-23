import {
  CookingPot,
  Headphones,
  type LucideIcon,
  Shirt,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type Category = 'electronics' | 'fashion' | 'home' | 'beauty' | 'grocery';

const ICON: Record<Category, LucideIcon> = {
  electronics: Headphones,
  fashion: Shirt,
  home: CookingPot,
  beauty: Sparkles,
  grocery: ShoppingBasket,
};

const TINT: Record<Category, string> = {
  electronics: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  fashion: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  home: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  beauty: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  grocery: 'bg-lime-100 text-lime-900 dark:bg-lime-950 dark:text-lime-200',
};

/** Product image placeholder — the mock has no real photography. */
export function ProductThumb({
  category,
  size = 'md',
}: {
  category: Category;
  size?: 'sm' | 'md';
}) {
  const Icon = ICON[category];
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        TINT[category],
        size === 'md' ? 'size-12' : 'size-10',
      )}
    >
      <Icon className={size === 'md' ? 'size-6' : 'size-5'} strokeWidth={1.75} />
    </span>
  );
}
