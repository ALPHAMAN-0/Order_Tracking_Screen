/**
 * The only place that reads the system time (R2). Everything else receives
 * `now` as an argument or from `useNow()`, which keeps the domain pure and
 * lets tests pin time with `vi.spyOn(clock, 'now')` or fake timers.
 */
export const clock = {
  now: (): number => Date.now(),
};
