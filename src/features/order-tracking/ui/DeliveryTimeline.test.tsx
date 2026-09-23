import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from '@/components/ui/Toast';
import { ORDER_FIXTURES } from '@/features/order-tracking/data/fixtures/orders';
import { resolveOrderFixture } from '@/features/order-tracking/data/fixtures/resolve-order';
import { deriveTrackingView } from '@/features/order-tracking/domain/derive-tracking-view';
import { EMPTY_CLIENT_STATE } from '@/features/order-tracking/domain/types';
import { TEST_NOW } from '@/test/render';
import { DeliveryTimeline } from './DeliveryTimeline';

function vmFor(id: string) {
  const fixture = ORDER_FIXTURES.find((f) => f.id === id)!;
  return deriveTrackingView({
    order: resolveOrderFixture(fixture, TEST_NOW),
    now: TEST_NOW,
    clientState: EMPTY_CLIENT_STATE,
  });
}

describe('DeliveryTimeline', () => {
  it('is an ordered list of 5 steps with exactly one current step', () => {
    render(
      <ToastProvider>
        <DeliveryTimeline timeline={vmFor('SW-39870').timeline} />
      </ToastProvider>,
    );
    const list = screen.getByRole('list', { name: 'Delivery steps' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    const current = items.filter((li) => li.getAttribute('aria-current') === 'step');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Current step: Shipped');
    expect(current[0]).toHaveTextContent('Heavy rain · Chattogram Hub');
    expect(items[0]).toHaveTextContent('Completed: Order placed');
    expect(items[4]).toHaveTextContent('Upcoming: Delivered');
  });

  it('explains the pending state instead of leaving steps blank', () => {
    render(
      <ToastProvider>
        <DeliveryTimeline timeline={vmFor('SW-40290').timeline} />
      </ToastProvider>,
    );
    expect(screen.getByText('Waiting for the first carrier scan')).toBeInTheDocument();
    expect(screen.queryByText(/tracking number/i)).not.toBeInTheDocument();
  });
});
