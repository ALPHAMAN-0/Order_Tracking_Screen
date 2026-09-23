'use client';

import { CircleCheck } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

/**
 * One polite live region; the latest message replaces the previous one.
 * While a modal sheet is open the page behind it is inert (hidden from
 * assistive tech and covered visually), so a toast waits for the sheet to
 * close. In-sheet feedback belongs inside the sheet itself.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const counter = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback<ShowToast>((message) => {
    clearTimeout(pending.current);
    const deliver = (attempt: number) => {
      if (attempt < 30 && document.querySelector('dialog[open]')) {
        pending.current = setTimeout(() => deliver(attempt + 1), 50);
        return;
      }
      counter.current += 1;
      setToast({ id: counter.current, message });
    };
    deliver(0);
  }, []);

  useEffect(() => () => clearTimeout(pending.current), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
      >
        {toast && (
          <p
            key={toast.id}
            className="flex max-w-[398px] items-center gap-2 rounded-xl bg-fg px-4 py-3 text-sm font-medium text-bg shadow-sheet"
          >
            <CircleCheck aria-hidden className="size-4 shrink-0" />
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}
