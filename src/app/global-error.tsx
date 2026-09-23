'use client';

import './globals.css';

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-dvh max-w-[430px] flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <title>Something went wrong · Haatbox</title>
          <h1 className="text-xl font-semibold text-fg">Something went wrong</h1>
          <p className="text-[15px] text-fg-muted">Please try again. Your orders are unaffected.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="min-h-11 rounded-xl bg-brand px-5 font-semibold text-brand-fg"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
