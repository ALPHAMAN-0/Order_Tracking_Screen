/** Demo-only request conditions, driven by `?simulate=` (see README). */
export const SIMULATIONS = ['loading', 'error', 'notfound', 'empty'] as const;
export type Simulation = (typeof SIMULATIONS)[number];

export const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO !== 'off';

export function parseSimulation(value: string | null | undefined): Simulation | null {
  if (!DEMO_ENABLED || !value) return null;
  return (SIMULATIONS as readonly string[]).includes(value) ? (value as Simulation) : null;
}
