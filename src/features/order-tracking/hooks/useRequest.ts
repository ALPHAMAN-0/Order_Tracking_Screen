'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RequestOptions } from '@/features/order-tracking/data';

export type RequestState<T> =
  { status: 'loading' } | { status: 'error' } | { status: 'success'; data: T };

/**
 * Tiny fetch state machine with abort-on-unmount and retry.
 * `attempt` is state (not a closure counter) so StrictMode's double effect
 * can't skip the demo's "fail once, then succeed" behaviour.
 */
export function useRequest<T>(
  run: (options: RequestOptions) => Promise<T>,
  deps: readonly unknown[],
): { state: RequestState<T>; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RequestState<T>>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    run({ signal: controller.signal, attempt }).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data });
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      },
    );
    return () => controller.abort();
    // `run` is recreated every render; `deps` + `attempt` define identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  return { state, retry };
}
