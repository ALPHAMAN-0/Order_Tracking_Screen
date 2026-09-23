'use client';

import { FileSearch, Hourglass, MessageCircle, ReceiptText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRef, useState, type RefObject } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type {
  ActionId,
  MissingFlowView,
  RefundFlowView,
  TopicId,
  TrackingViewModel,
} from '@/features/order-tracking/domain/view-model';
import {
  useTrackingScreen,
  type TrackingActions,
} from '@/features/order-tracking/hooks/useTrackingScreen';
import { ActionBar } from './ActionBar';
import { DelayBanner } from './DelayBanner';
import { DeliveryTimeline } from './DeliveryTimeline';
import { OrderSummaryCard } from './OrderSummaryCard';
import { ProofOfDelivery } from './ProofOfDelivery';
import { StatusBanner } from './StatusBanner';
import { StatusHero } from './StatusHero';
import { SupportCard } from './SupportCard';
import { TrackingHeader } from './TrackingHeader';
import { TrackingPendingCard } from './TrackingPendingCard';
import { MissingPackageFlow } from './sheets/MissingPackageFlow';
import { OrderDetailsSheet } from './sheets/OrderDetailsSheet';
import { RefundCancelSheet } from './sheets/RefundCancelSheet';
import { SupportSheet } from './sheets/SupportSheet';
import { ErrorState } from './states/ErrorState';
import { NotFoundState } from './states/NotFoundState';
import { TrackingSkeleton } from './states/TrackingSkeleton';

/**
 * One sheet at a time (R10). Flows keep a snapshot of their view model taken
 * when opened, so the sheet stays stable while the screen behind it updates.
 */
type Sheet =
  | { kind: 'details' }
  | { kind: 'support'; topic: TopicId; view: 'channels' | 'chat' }
  | { kind: 'missing'; flow: MissingFlowView }
  | { kind: 'refund'; flow: RefundFlowView };

interface SheetState {
  open: boolean;
  /** Increments per open so each sheet starts fresh. */
  session: number;
  sheet: Sheet | null;
}

export function TrackingScreen({ orderId }: { orderId: string }) {
  const simulate = useSearchParams().get('simulate');
  // Remount on scenario/state change so every demo switch starts clean.
  return (
    <TrackingScreenInner
      key={`${orderId}:${simulate ?? ''}`}
      orderId={orderId}
      simulate={simulate}
    />
  );
}

function TrackingScreenInner({ orderId, simulate }: { orderId: string; simulate: string | null }) {
  const { view, vm, support, retry, actions } = useTrackingScreen(orderId, simulate);
  const toast = useToast();
  const [state, setState] = useState<SheetState>({ open: false, session: 0, sheet: null });
  const outcomeHeadingRef = useRef<HTMLHeadingElement>(null);

  const openSheet = (sheet: Sheet) =>
    setState((s) => ({ open: true, session: s.session + 1, sheet }));
  const close = () => setState((s) => ({ ...s, open: false }));
  const openSupport = (topic?: TopicId, supportView: 'channels' | 'chat' = 'channels') =>
    openSheet({
      kind: 'support',
      topic: topic ?? support?.topic ?? 'where_is_order',
      view: supportView,
    });

  function onAction(id: ActionId) {
    if (!vm) return;
    switch (id) {
      case 'contact_support':
        openSupport(vm.support.topic, vm.status === 'investigating' ? 'chat' : 'channels');
        break;
      case 'report_missing':
        if (vm.missingFlow) openSheet({ kind: 'missing', flow: vm.missingFlow });
        else openSupport('not_received');
        break;
      case 'request_refund_or_cancel':
        if (vm.refundFlow) openSheet({ kind: 'refund', flow: vm.refundFlow });
        break;
    }
  }

  const { sheet, open, session } = state;
  const is = (kind: Sheet['kind']) => open && sheet?.kind === kind;

  return (
    <>
      <TrackingHeader orderId={orderId} onHelp={support ? () => openSupport() : undefined} />
      <main id="main" className="flex flex-col gap-3 pt-2">
        {view === 'loading' && <TrackingSkeleton />}
        {view === 'error' && (
          <ErrorState
            onRetry={retry}
            onContactSupport={support ? () => openSupport() : undefined}
          />
        )}
        {view === 'not_found' && (
          <NotFoundState
            orderId={orderId}
            extraAction={
              support && (
                <Button variant="secondary" fullWidth onClick={() => openSupport('other')}>
                  <MessageCircle aria-hidden />
                  Contact support
                </Button>
              )
            }
          />
        )}
        {view === 'ready' && vm && (
          <TrackingContent
            vm={vm}
            actions={actions}
            onAction={onAction}
            onViewDetails={() => openSheet({ kind: 'details' })}
            onContactSupport={() => openSupport(vm.support.topic)}
            outcomeHeadingRef={outcomeHeadingRef}
          />
        )}
        <p className="px-2 pt-4 text-center text-xs text-fg-subtle">
          Haatbox is a fictional demo store. All orders, people and places are sample data.
        </p>
      </main>

      {vm && (
        <OrderDetailsSheet
          key={`details-${session}`}
          open={is('details')}
          onClose={close}
          details={vm.details}
        />
      )}
      {support && sheet?.kind === 'support' && (
        <SupportSheet
          key={`support-${session}`}
          open={is('support')}
          onClose={close}
          support={support}
          initialTopic={sheet.topic}
          initialView={sheet.view}
        />
      )}
      {sheet?.kind === 'missing' && (
        <MissingPackageFlow
          key={`missing-${session}`}
          open={is('missing')}
          onClose={close}
          flow={sheet.flow}
          onSubmit={actions.reportMissing}
          finalFocusRef={outcomeHeadingRef}
        />
      )}
      {sheet?.kind === 'refund' && (
        <RefundCancelSheet
          key={`refund-${session}`}
          open={is('refund')}
          onClose={close}
          flow={sheet.flow}
          onCancelOrder={actions.requestCancellation}
          onKeepWaiting={() => {
            actions.setToggle('notify_changes', true);
            toast('Got it — we’ll text you if the delivery date changes.');
          }}
          finalFocusRef={outcomeHeadingRef}
        />
      )}
    </>
  );
}

function TrackingContent({
  vm,
  actions,
  onAction,
  onViewDetails,
  onContactSupport,
  outcomeHeadingRef,
}: {
  vm: TrackingViewModel;
  actions: TrackingActions;
  onAction: (id: ActionId) => void;
  onViewDetails: () => void;
  onContactSupport: () => void;
  outcomeHeadingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <>
      <StatusHero vm={vm} />

      {vm.caseBanner && (
        <StatusBanner
          tone="danger"
          icon={FileSearch}
          title={`${vm.caseBanner.title} · ${vm.caseBanner.caseId}`}
          body={vm.caseBanner.body}
          meta={vm.caseBanner.nextUpdateLabel}
          steps={vm.caseBanner.steps}
          headingRef={outcomeHeadingRef}
        />
      )}
      {vm.cancellationBanner && (
        <StatusBanner
          tone="neutral"
          icon={ReceiptText}
          title={vm.cancellationBanner.title}
          body={vm.cancellationBanner.body}
          headingRef={outcomeHeadingRef}
        />
      )}
      {vm.delay && <DelayBanner delay={vm.delay} onToggle={actions.setToggle} />}
      {vm.pending?.stale && (
        <StatusBanner
          tone="warning"
          icon={Hourglass}
          title={vm.pending.stale.title}
          body={vm.pending.stale.body}
        />
      )}
      {vm.pending && <TrackingPendingCard pending={vm.pending} onToggle={actions.setToggle} />}
      {vm.proofOfDelivery && <ProofOfDelivery pod={vm.proofOfDelivery} onAction={onAction} />}

      <ActionBar primary={vm.primaryAction} secondary={vm.secondaryAction} onAction={onAction} />

      <DeliveryTimeline timeline={vm.timeline} />
      <OrderSummaryCard summary={vm.summary} onViewDetails={onViewDetails} />
      <SupportCard support={vm.support} onContact={onContactSupport} />
    </>
  );
}
