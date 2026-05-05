"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";

const titleMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/projects": "Projects",
  "/dashboard/tasks": "All tasks",
};

export default function DashboardHeader() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? "";

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="flex h-full items-center gap-4 px-6">
        {title && (
          <h2 className="text-sm font-medium tracking-tight text-foreground">
            {title}
          </h2>
        )}

        <div className="hidden flex-1 md:flex">
          <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm transition focus-within:border-foreground/30">
            <Search
              size={15}
              strokeWidth={1.75}
              className="text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search tasks…"
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/70 outline-none"
            />
            <kbd className="hidden items-center rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Bell size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}
