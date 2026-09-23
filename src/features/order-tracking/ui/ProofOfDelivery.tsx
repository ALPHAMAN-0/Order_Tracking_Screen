import { Camera } from 'lucide-react';
import type { ActionId, ProofOfDeliveryView } from '@/features/order-tracking/domain/view-model';

function DoorstepPhoto({ alt }: { alt: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800"
    >
      <svg aria-hidden viewBox="0 0 96 128" className="absolute inset-0 size-full">
        <rect
          x="22"
          y="14"
          width="52"
          height="92"
          rx="3"
          className="fill-emerald-700 dark:fill-emerald-800"
        />
        <rect
          x="28"
          y="20"
          width="40"
          height="36"
          rx="2"
          className="fill-emerald-600 dark:fill-emerald-700"
        />
        <circle cx="64" cy="66" r="2.5" className="fill-amber-300" />
        <rect
          x="12"
          y="104"
          width="72"
          height="10"
          rx="2"
          className="fill-stone-500 dark:fill-stone-600"
        />
        <rect x="36" y="86" width="26" height="20" rx="2" className="fill-amber-600" />
        <rect x="47" y="86" width="4" height="20" className="fill-amber-200/80" />
      </svg>
      <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white">
        <Camera aria-hidden className="size-3" />
        Photo
      </span>
    </div>
  );
}

export function ProofOfDelivery({
  pod,
  onAction,
}: {
  pod: ProofOfDeliveryView;
  onAction: (id: ActionId) => void;
}) {
  return (
    <section
      aria-labelledby="pod-title"
      className="rounded-2xl border border-border bg-surface p-4 shadow-card"
    >
      <h2 id="pod-title" className="text-[15px] font-semibold text-fg">
        Proof of delivery
      </h2>
      <div className="mt-3 flex gap-3">
        <DoorstepPhoto alt={pod.photoAlt} />
        <dl className="min-w-0 space-y-2 text-sm">
          <div>
            <dt className="text-xs font-medium text-fg-muted">Where</dt>
            <dd className="font-medium text-fg">{pod.placementLabel}</dd>
          </div>
          {pod.receivedBy && (
            <div>
              <dt className="text-xs font-medium text-fg-muted">Received by</dt>
              <dd className="font-medium text-fg">{pod.receivedBy}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium text-fg-muted">Address</dt>
            <dd className="text-fg">{pod.maskedAddress}</dd>
          </div>
        </dl>
      </div>
      {pod.reportLink && (
        <button
          type="button"
          onClick={() => onAction(pod.reportLink!.id)}
          className="mt-3 min-h-11 text-sm font-semibold text-brand-text underline underline-offset-4"
        >
          {pod.reportLink.label}
        </button>
      )}
    </section>
  );
}
