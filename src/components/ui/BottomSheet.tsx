'use client';

import { X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

const CLOSE_MS = 220;
const SWIPE_CLOSE_PX = 80;

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Rendered left of the title, e.g. a Back button inside a multi-step flow. */
  leading?: ReactNode;
  /** Where focus goes on open. Defaults to the sheet title. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Where focus goes on close. Defaults to the element that opened the sheet. */
  finalFocusRef?: RefObject<HTMLElement | null>;
  /** Changing this moves focus back to the title (announce a new step). */
  stepKey?: string | number;
  className?: string;
}

/**
 * Modal bottom sheet on native <dialog>: the browser provides the top layer,
 * inert background, focus containment and Esc. This adds animation, backdrop
 * tap, swipe-to-close on the handle, scroll lock and focus return.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  leading,
  initialFocusRef,
  finalFocusRef,
  stepKey,
  className,
}: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const drag = useRef<{ startY: number; dy: number } | null>(null);
  const onCloseRef = useRef(onClose);
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (dialog.open) {
        // Re-run of this effect (e.g. React StrictMode) — restore the lock too.
        dialog.dataset.state = 'open';
        document.documentElement.style.overflow = 'hidden';
        return;
      }
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
      (initialFocusRef?.current ?? titleRef.current)?.focus();
      const frame = requestAnimationFrame(() => {
        dialog.dataset.state = 'open';
      });
      return () => cancelAnimationFrame(frame);
    }

    if (!dialog.open) return;
    dialog.dataset.state = 'closed';
    const finalTarget = finalFocusRef;
    const timer = setTimeout(
      () => {
        dialog.close();
        document.documentElement.style.overflow = '';
        const target = finalTarget?.current ?? returnFocus.current;
        if (target?.isConnected) target.focus();
      },
      reducedMotion ? 0 : CLOSE_MS,
    );
    return () => clearTimeout(timer);
    // Focus refs are read at transition time on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reducedMotion]);

  // Announce each new step of a multi-step flow.
  useEffect(() => {
    if (open && stepKey !== undefined) titleRef.current?.focus();
  }, [open, stepKey]);

  // Never leave the page scroll-locked if the sheet unmounts while open.
  useEffect(
    () => () => {
      document.documentElement.style.overflow = '';
    },
    [],
  );

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    dialogRef.current?.setAttribute('data-dragging', '');
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.startY);
    panelRef.current?.style.setProperty('--drag', `${drag.current.dy}px`);
  }

  function onPointerEnd() {
    if (!drag.current) return;
    const { dy } = drag.current;
    drag.current = null;
    dialogRef.current?.removeAttribute('data-dragging');
    panelRef.current?.style.setProperty('--drag', '0px');
    if (dy > SWIPE_CLOSE_PX) onCloseRef.current();
  }

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onCloseRef.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        className={cn(
          'sheet-panel flex max-h-[88dvh] w-full max-w-[430px] flex-col rounded-t-3xl bg-surface text-fg shadow-sheet',
          className,
        )}
      >
        <div
          className="shrink-0 touch-none px-4 pt-2 pb-3"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div aria-hidden className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border-strong" />
          <div className="flex items-start gap-2">
            {leading}
            <div className="min-w-0 flex-1 pt-2">
              <h2
                ref={titleRef}
                id={titleId}
                tabIndex={-1}
                className="text-lg leading-snug font-semibold text-balance outline-none"
              >
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-0.5 text-sm text-fg-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onCloseRef.current()}
              className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2"
              aria-label="Close"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
        {!footer && <div aria-hidden className="h-[env(safe-area-inset-bottom)] shrink-0" />}
      </div>
    </dialog>
  );
}
