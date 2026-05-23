"use client";

import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
      <section className="w-full rounded-3xl border border-red-300/35 bg-red-500/10 p-5 text-center shadow-2xl shadow-black/30 backdrop-blur">
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-red-100">A recoverable page error occurred.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300/55 bg-red-500/25 px-4 text-sm font-semibold text-red-50 transition hover:bg-red-500/35"
        >
          Try again
        </button>
      </section>
    </main>
  );
}

