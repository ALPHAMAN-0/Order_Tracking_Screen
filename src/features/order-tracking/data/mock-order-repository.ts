import { clock } from '@/lib/clock';
import { toMs } from '@/features/order-tracking/domain/time';
import { ORDER_FIXTURES } from './fixtures/orders';
import { resolveOrderFixture, type OrderFixture } from './fixtures/resolve-order';
import { OrderFetchError, type OrderRepository, type RequestOptions } from './order-repository';

function abortError(): DOMException {
  return new DOMException('The request was aborted.', 'AbortError');
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = ms === Infinity ? undefined : setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

export interface MockRepositoryOptions {
  now?: () => number;
  latencyMs?: number;
  fixtures?: OrderFixture[];
}

/** In-memory repository with realistic latency and demo failure modes. */
export function createMockOrderRepository({
  now = () => clock.now(),
  latencyMs = 650,
  fixtures = ORDER_FIXTURES,
}: MockRepositoryOptions = {}): OrderRepository {
  async function request({ signal, simulate, attempt = 0 }: RequestOptions) {
    await wait(simulate === 'loading' ? Infinity : latencyMs, signal);
    if (simulate === 'error' && attempt === 0) throw new OrderFetchError();
  }

  return {
    async getOrder(id, options = {}) {
      await request(options);
      if (options.simulate === 'notfound') return null;
      const fixture = fixtures.find((f) => f.id === id);
      return fixture ? resolveOrderFixture(fixture, now()) : null;
    },
    async listOrders(options = {}) {
      await request(options);
      if (options.simulate === 'empty') return [];
      const at = now();
      return fixtures
        .map((f) => resolveOrderFixture(f, at))
        .sort((a, b) => toMs(b.placedAt) - toMs(a.placedAt));
    },
  };
}
