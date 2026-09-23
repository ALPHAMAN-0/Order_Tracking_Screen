import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '@/test/render';
import { TrackingScreen } from './TrackingScreen';

describe('TrackingScreen', () => {
  it.each([
    ['SW-40211', 'Arriving tomorrow', 'On track'],
    ['SW-39870', 'Running late', 'Delayed'],
    ['SW-39215', '5 days late', 'Significantly delayed'],
    ['SW-40107', 'Delivered today', 'Delivered'],
    ['SW-40290', 'Preparing your order', 'Preparing'],
  ])('%s shows "%s" with a "%s" status', async (id, headline, pill) => {
    renderWithApp(<TrackingScreen orderId={id} />);
    expect(screen.getByRole('status', { busy: true })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: headline })).toBeInTheDocument();
    expect(screen.getAllByText(pill).length).toBeGreaterThan(0);
  });

  it('delayed order: explains why and offers alerts + support', async () => {
    renderWithApp(<TrackingScreen orderId="SW-39870" />);
    await screen.findByRole('heading', { level: 1, name: 'Running late' });
    expect(screen.getByText('Heavy rain slowed deliveries at Chattogram Hub.')).toBeInTheDocument();
    expect(screen.getByText('Tue, 22 Sep').tagName).toBe('DEL');
    const toggle = screen.getByRole('switch', { name: 'Notify me of changes' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(
      await screen.findByText('We’ll text you if the delivery date changes.'),
    ).toBeInTheDocument();
  });

  it('delivered but not received: report flow opens an investigation', async () => {
    renderWithApp(<TrackingScreen orderId="SW-40107" />);
    await userEvent.click(await screen.findByRole('button', { name: 'I didn’t receive it' }));

    const sheet = screen.getByRole('dialog', { name: 'Before you report' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'It’s still missing' }));
    expect(screen.getByRole('dialog', { name: 'What happened?' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    expect(screen.getByText('Choose what happened to continue.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: /Nothing arrived/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    const caseId = within(screen.getByRole('dialog', { name: 'Report submitted' })).getByText(
      /^CASE-/,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We’re looking into it' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: `Investigation open · ${caseId.textContent}` }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'I didn’t receive it' })).not.toBeInTheDocument();
  });

  it('significant delay: cancel for a refund replaces the CTA with a confirmation', async () => {
    renderWithApp(<TrackingScreen orderId="SW-39215" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Request refund or cancel' }));
    await userEvent.click(screen.getByRole('radio', { name: /Cancel and refund ৳12,480/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(screen.getByRole('dialog', { name: 'Cancellation requested' })).toHaveTextContent(
      '৳12,480 goes back to Card •••• 1881',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Refund on its way' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^Cancellation requested · RF-[A-Z0-9]{6}$/ }),
    ).toBeInTheDocument();
    // No leftover delivery promises once cancelled.
    expect(screen.queryByText('New estimate')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Notify me of changes' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Request refund or cancel' }),
    ).not.toBeInTheDocument();
  });

  it('support sheet preselects the topic and prefills call and email', async () => {
    renderWithApp(<TrackingScreen orderId="SW-39870" />);
    await userEvent.click(await screen.findByRole('button', { name: 'Ask about this delay' }));
    const sheet = screen.getByRole('dialog', { name: 'How can we help?' });
    expect(within(sheet).getByRole('button', { name: 'Delayed delivery' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(sheet).getByRole('link', { name: /Call \+880 1000-123456/ })).toHaveAttribute(
      'href',
      'tel:+8801000123456',
    );
    const email = within(sheet)
      .getByRole('link', { name: /Email us/ })
      .getAttribute('href')!;
    expect(decodeURIComponent(email)).toContain('Order #SW-39870 — Delayed delivery');

    await userEvent.click(within(sheet).getByRole('button', { name: /Live chat/ }));
    const chat = screen.getByRole('dialog', { name: 'Chat with Nusrat' });
    expect(within(chat).getByRole('log')).toHaveTextContent('running late');
    await userEvent.click(within(chat).getByRole('button', { name: 'Send message' }));
    expect(
      await within(chat).findByText(/flagged your parcel as a priority/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('tracking pending: never empty — explains why and offers an alert', async () => {
    renderWithApp(<TrackingScreen orderId="SW-40290" />);
    await screen.findByRole('heading', { level: 1, name: 'Preparing your order' });
    expect(
      screen.getByRole('heading', { name: 'Why there’s no tracking yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Notify me when tracking is live' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Fri 25 – Sun 27 Sep')).toBeInTheDocument();
  });
});
