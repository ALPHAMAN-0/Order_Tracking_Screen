import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import { ToastProvider } from '@/components/ui/Toast';
import { createMockOrderRepository } from '@/features/order-tracking/data';
import { OrderRepositoryProvider } from '@/features/order-tracking/hooks/repository-context';
import { clock } from '@/lib/clock';
import { resetNowForTests } from '@/lib/hooks/useNow';

/** Wed 23 Sep 2026, 2:00 PM in Dhaka. */
export const TEST_NOW = Date.parse('2026-09-23T08:00:00Z');

/** Renders with a zero-latency mock repository and a pinned clock. */
export function renderWithApp(ui: ReactElement, { now = TEST_NOW } = {}) {
  vi.spyOn(clock, 'now').mockReturnValue(now);
  resetNowForTests();
  const repository = createMockOrderRepository({ now: () => now, latencyMs: 0 });
  return render(
    <ToastProvider>
      <OrderRepositoryProvider repository={repository}>{ui}</OrderRepositoryProvider>
    </ToastProvider>,
  );
}
