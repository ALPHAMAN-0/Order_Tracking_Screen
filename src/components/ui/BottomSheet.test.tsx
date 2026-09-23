import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open sheet</button>
      <BottomSheet
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="Sheet title"
        description="Sheet description"
      >
        <button>Inside</button>
      </BottomSheet>
    </>
  );
}

describe('BottomSheet', () => {
  it('opens as a labelled modal dialog and focuses its title', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open sheet' }));
    const dialog = screen.getByRole('dialog', { name: 'Sheet title' });
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAccessibleDescription('Sheet description');
    expect(screen.getByRole('heading', { name: 'Sheet title' })).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('closes on Esc (cancel), backdrop click and the close button — not on content clicks', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const open = () =>
      userEvent.click(screen.getByRole('button', { name: 'Open sheet', hidden: true }));

    await open();
    const dialog = screen.getByRole('dialog');
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Inside', hidden: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('dialog', { hidden: true }));
    expect(onClose).toHaveBeenCalledTimes(2);

    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('returns focus to the trigger and unlocks scroll after closing', async () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open sheet' });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await vi.waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open');
    expect(document.documentElement.style.overflow).toBe('');
  });
});
