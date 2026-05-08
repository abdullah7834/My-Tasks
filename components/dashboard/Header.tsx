"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";

const titleMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/projects": "Projects",
  "/dashboard/tasks": "All tasks",
  "/dashboard/profile": "Profile",
};

export default function DashboardHeader({ user }: { user: { id?: string; full_name?: string | null; email?: string | null; avatar_url?: string | null } }) {
  const [openProfile, setOpenProfile] = useState(false);
  const pathname = usePathname();
  const title = titleMap[pathname] ?? "";
  const displayName = user.full_name?.trim() || user.email?.split("@")[0] || "You";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = user.avatar_url?.trim() || null;

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

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Bell size={16} strokeWidth={1.75} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenProfile((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-3xl border border-border bg-background px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-foreground">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${displayName} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </span>
              <span className="hidden sm:inline">{displayName}</span>
              <ChevronDown size={16} className={`${openProfile ? "rotate-180" : ""} transition`} />
            </button>

            {openProfile && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-lg shadow-black/20">
                <div className="space-y-1 rounded-xl px-1 py-1 text-sm text-foreground">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Signed in as</p>
                  <p className="break-words font-semibold">{user.email ?? "No email"}</p>
                </div>
                <div className="my-2 h-px bg-border" />
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpenProfile(false)}
                  className="block rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                >
                  My Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
