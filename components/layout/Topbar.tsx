"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export function Topbar() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.push("/login");
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 px-4 py-4 shadow-sm shadow-black/10 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-slate-300 shadow-sm shadow-black/10">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search tasks, projects..."
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
        >
          <LogOut size={16} />
          {loading ? "Signing out" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
