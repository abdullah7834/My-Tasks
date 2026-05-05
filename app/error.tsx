"use client";

import { useEffect } from "react";

export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-slate-200 shadow-xl shadow-black/20">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-slate-400">Please refresh or come back later.</p>
      </div>
    </div>
  );
}
