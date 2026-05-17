"use client";

import { useEffect } from "react";

export default function ErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Try again, or come back later.
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition hover:bg-foreground/90 active:translate-y-px"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
