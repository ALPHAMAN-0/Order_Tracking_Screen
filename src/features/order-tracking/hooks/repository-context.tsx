'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { defaultOrderRepository, type OrderRepository } from '@/features/order-tracking/data';

const OrderRepositoryContext = createContext<OrderRepository>(defaultOrderRepository);

/** Swap the data source (tests inject a zero-latency repository) — R5. */
export function OrderRepositoryProvider({
  repository,
  children,
}: {
  repository: OrderRepository;
  children: ReactNode;
}) {
  return <OrderRepositoryContext value={repository}>{children}</OrderRepositoryContext>;
}

export function useOrderRepository(): OrderRepository {
  return useContext(OrderRepositoryContext);
}
