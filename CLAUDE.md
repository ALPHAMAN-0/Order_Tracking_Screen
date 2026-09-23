# CLAUDE.md

- Commands: `npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:e2e` (builds first) · `npm run verify` (all).
- Node 22 (`.nvmrc`). Keep TypeScript on 5.x — do not upgrade to TS 7 (Next/ESLint tooling still needs the JS API).
- Layering is enforced by ESLint: `domain/` is pure TS (R1); only `src/lib/clock.ts` reads the time (R2); `ui/` consumes view models via hooks, never raw orders or `data/` (R3).
- Every user-facing string, date and amount is produced in `domain/` (`derive-tracking-view.ts`, `format.ts`) — components only lay it out.
- Dates are always formatted for `Asia/Dhaka`; tests run in New York time to prove it.
- Fixtures are relative to "now" — never hard-code dates; the 72h sweep in `data/fixtures.test.ts` must keep passing.
- Tailwind v4 tokens live in `src/app/globals.css`; tone → class maps are static (`components/ui/tones.ts`).
- Files worth reading first:
  - `README.md`
  - `ARCHITECTURE.md`
  - `src/features/order-tracking/domain/derive-tracking-view.ts`
  - `src/features/order-tracking/ui/TrackingScreen.tsx`

Architecture: see ARCHITECTURE.md — read before structural changes

@AGENTS.md
