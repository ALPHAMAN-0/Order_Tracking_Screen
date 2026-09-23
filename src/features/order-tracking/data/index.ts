import { createMockOrderRepository } from './mock-order-repository';

/** App-wide default repository. Swap for a real API client here. */
export const defaultOrderRepository = createMockOrderRepository();

export { createMockOrderRepository } from './mock-order-repository';
export type { OrderRepository, RequestOptions } from './order-repository';
export { OrderFetchError } from './order-repository';
export { SCENARIOS, orderExists, type Scenario } from './scenarios';
export { parseSimulation, DEMO_ENABLED, type Simulation } from './simulation';
export {
  clientStateKey,
  parseClientState,
  readClientState,
  updateClientState,
  resetAllClientState,
} from './client-state-store';
