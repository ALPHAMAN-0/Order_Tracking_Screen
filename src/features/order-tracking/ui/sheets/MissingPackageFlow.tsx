'use client';

import {
  Building2,
  ChevronLeft,
  CircleCheck,
  Copy,
  DoorOpen,
  Info,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState, type RefObject } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { RadioCardGroup } from '@/components/ui/RadioCardGroup';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import type { MissingFlowView, MissingReasonId } from '@/features/order-tracking/domain/view-model';

const CHECK_ICONS: LucideIcon[] = [DoorOpen, Building2, Users];

type Step = 1 | 2 | 3;

/**
 * Delivered-but-not-received: 1) quick checks → 2) report → 3) case reference.
 * The checklist advises but never blocks — the customer can always report.
 */
export function MissingPackageFlow({
  open,
  onClose,
  flow,
  onSubmit,
  finalFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  flow: MissingFlowView;
  onSubmit: (input: { reason: MissingReasonId; note?: string }) => string;
  finalFocusRef?: RefObject<HTMLElement | null>;
}) {
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [reason, setReason] = useState<MissingReasonId | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const [caseId, setCaseId] = useState<string | null>(null);
  const reasonsRef = useRef<HTMLFieldSetElement>(null);

  function submit() {
    if (!reason) {
      setError('Choose what happened to continue.');
      reasonsRef.current?.focus();
      return;
    }
    setCaseId(onSubmit({ reason, note }));
    setStep(3);
  }

  async function copyCase() {
    if (!caseId) return;
    try {
      await navigator.clipboard.writeText(caseId);
      toast('Case reference copied.');
    } catch {
      toast(`Case reference: ${caseId}`);
    }
  }

  const titles: Record<Step, string> = {
    1: 'Before you report',
    2: 'What happened?',
    3: 'Report submitted',
  };

  const footer =
    step === 1 ? (
      <div className="flex flex-col gap-2">
        <Button fullWidth onClick={() => setStep(2)}>
          It’s still missing
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            onClose();
            toast('Great — glad it turned up!');
          }}
        >
          I found it
        </Button>
      </div>
    ) : step === 2 ? (
      <Button fullWidth onClick={submit}>
        Submit report
      </Button>
    ) : (
      <Button fullWidth onClick={onClose}>
        Done
      </Button>
    );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={titles[step]}
      description={`Step ${step} of 3 · Order #${flow.orderId}`}
      stepKey={step}
      finalFocusRef={step === 3 ? finalFocusRef : undefined}
      footer={footer}
      leading={
        step === 2 ? (
          <button
            type="button"
            onClick={() => setStep(1)}
            aria-label="Back to checklist"
            className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
        ) : undefined
      }
    >
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-surface-2 p-3 text-sm text-fg">
            The carrier marked this delivered{' '}
            <span className="font-semibold">{flow.deliveredLabel}</span> —{' '}
            {flow.placementLabel.toLowerCase()}.
          </p>
          <div>
            <h3 className="text-sm font-semibold text-fg">A few quick checks</h3>
            <ul className="mt-2 flex flex-col gap-2.5">
              {flow.checklist.map((item, i) => {
                const Icon = CHECK_ICONS[i] ?? Info;
                return (
                  <li key={item} className="flex gap-3 text-sm text-fg">
                    <Icon aria-hidden className="mt-0.5 size-[18px] shrink-0 text-fg-muted" />
                    <span>{item}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          {flow.suggestWaiting && (
            <p className="flex gap-2 rounded-xl border border-border p-3 text-sm text-fg-muted">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                Most “missing” parcels turn up within a day. You can report now, or check again by{' '}
                <span className="font-medium text-fg">{flow.waitUntilLabel}</span>.
              </span>
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <RadioCardGroup
            ref={reasonsRef}
            legend="Choose the closest match"
            name="missing-reason"
            options={flow.reasons}
            value={reason}
            error={error}
            onChange={(value) => {
              setReason(value);
              setError(undefined);
            }}
          />
          <Textarea
            label="Anything else? (optional)"
            hint="For example where you looked, or who was home."
            value={note}
            onChange={setNote}
          />
        </div>
      )}

      {step === 3 && caseId && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center rounded-xl bg-success-soft p-4 text-center">
            <CircleCheck aria-hidden className="size-8 text-success" />
            <p className="mt-2 text-sm text-fg">Your case reference</p>
            <p className="font-mono text-lg font-semibold tracking-wide text-fg">{caseId}</p>
            <Button variant="ghost" size="sm" onClick={copyCase} className="mt-1">
              <Copy aria-hidden />
              Copy reference
            </Button>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-fg">What happens next</h3>
            <ol className="mt-2 flex flex-col gap-2">
              {flow.nextSteps.map((s, i) => (
                <li key={s} className="flex gap-2 text-sm text-fg">
                  <span
                    aria-hidden
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text"
                  >
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
