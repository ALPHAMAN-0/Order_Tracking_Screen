import type { Order } from '@/features/order-tracking/domain/types';
import type { Simulation } from './simulation';

export interface RequestOptions {
  signal?: AbortSignal;
  /** Demo only — honoured by the mock repository, ignored by a real one. */
  simulate?: Simulation | null;
  /** Retry counter; the mock's `error` simulation fails only the first attempt. */
  attempt?: number;
}

/** The seam a real API client would implement (R5). */
export interface OrderRepository {
  /** Resolves `null` when the order doesn't exist. */
  getOrder(id: string, options?: RequestOptions): Promise<Order | null>;
  listOrders(options?: RequestOptions): Promise<Order[]>;
}

export class OrderFetchError extends Error {
  constructor(message = 'We couldn’t reach the tracking service.') {
    super(message);
    this.name = 'OrderFetchError';
  }
}
