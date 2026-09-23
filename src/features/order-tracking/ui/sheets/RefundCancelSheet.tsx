'use client';

import { CircleCheck } from 'lucide-react';
import { useState, type RefObject } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { RadioCardGroup } from '@/components/ui/RadioCardGroup';
import type { RefundFlowView } from '@/features/order-tracking/domain/view-model';

type Choice = 'cancel' | 'keep';

/** Significant delay: let the customer decide — cancel for a refund, or keep waiting. */
export function RefundCancelSheet({
  open,
  onClose,
  flow,
  onCancelOrder,
  onKeepWaiting,
  finalFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  flow: RefundFlowView;
  onCancelOrder: () => string | null;
  onKeepWaiting: () => void;
  finalFocusRef?: RefObject<HTMLElement | null>;
}) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [error, setError] = useState<string>();
  const [refId, setRefId] = useState<string | null>(null);

  function confirm() {
    if (!choice) {
      setError('Choose an option to continue.');
      return;
    }
    if (choice === 'keep') {
      onKeepWaiting();
      onClose();
      return;
    }
    setRefId(onCancelOrder());
  }

  const done = refId !== null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={done ? flow.outcome.title : flow.delayLabel}
      description={done ? undefined : 'We’re sorry. Choose what works best for you.'}
      stepKey={done ? 'done' : 'choose'}
      finalFocusRef={done ? finalFocusRef : undefined}
      footer={
        <Button fullWidth onClick={done ? onClose : confirm}>
          {done ? 'Done' : 'Confirm'}
        </Button>
      }
    >
      {done ? (
        <div className="flex flex-col items-center rounded-xl bg-success-soft p-4 text-center">
          <CircleCheck aria-hidden className="size-8 text-success" />
          <p className="mt-2 text-sm text-pretty text-fg">{flow.outcome.body}</p>
          <p className="mt-2 text-sm text-fg-muted">
            Reference <span className="font-mono font-semibold text-fg">{refId}</span>
          </p>
        </div>
      ) : (
        <RadioCardGroup
          legend="Your options"
          name="refund-choice"
          value={choice}
          error={error}
          onChange={(value) => {
            setChoice(value);
            setError(undefined);
          }}
          options={[
            { id: 'cancel', label: flow.cancelLabel, description: flow.cancelDescription },
            { id: 'keep', label: flow.keepLabel, description: flow.keepDescription },
          ]}
        />
      )}
    </BottomSheet>
  );
}
