"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center bg-slate-950 px-4 text-slate-100">
          <section className="w-full rounded-3xl border border-red-300/35 bg-red-500/10 p-5 text-center shadow-2xl shadow-black/30 backdrop-blur">
            <h1 className="text-xl font-bold text-white">A critical error occurred</h1>
            <p className="mt-2 text-sm text-red-100">
              The app failed to render this screen. Please retry.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300/55 bg-red-500/25 px-4 text-sm font-semibold text-red-50 transition hover:bg-red-500/35"
            >
              Reload screen
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

