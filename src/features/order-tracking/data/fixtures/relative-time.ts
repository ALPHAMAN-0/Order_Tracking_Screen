/**
 * Fixtures are stored as offsets from "now" and resolved on the client, so a
 * delayed order is still delayed — and a pending one still pending — whenever
 * the evaluator opens the page.
 *
 * - Events use minutes ago → always in the past and ordered by construction.
 * - Windows use Dhaka calendar-day offsets → delay tiers don't depend on the
 *   time of day the page is viewed.
 */

export type HHmm = `${number}:${number}`;

export interface DayAt {
  day: number;
  at: HHmm;
}

export interface WindowFixture {
  from: DayAt;
  to: DayAt;
}

/** Minutes ago. `ago(3)` = 3 hours ago, `ago(1, 46)` = 1h46m ago. */
export const ago = (hours: number, minutes = 0): number => hours * 60 + minutes;

/** A delivery window on Dhaka day `day` (relative to today), optionally ending on `toDay`. */
export const win = (day: number, from: HHmm, to: HHmm, toDay = day): WindowFixture => ({
  from: { day, at: from },
  to: { day: toDay, at: to },
});
