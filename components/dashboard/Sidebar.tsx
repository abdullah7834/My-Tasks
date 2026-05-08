"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid, ListTodo, LogOut, FolderKanban, MessageSquare,
  ChevronDown, Users, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutGrid },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { name: "All tasks", href: "/dashboard/tasks", icon: ListTodo },
  { name: "Chats", href: "/dashboard/chats", icon: MessageSquare, hasDropdown: true, dropdownType: "chats" },
];

const adminItems = [
  { name: "Staff Directory", href: "/dashboard/administration/staff-directory", icon: Users },
  { name: "Roles & Permissions", href: "/dashboard/administration/roles-permissions", icon: ShieldCheck },
];

interface SidebarUser {
  id?: string | null;
  email?: string | null;
  full_name?: string | null;
}

export default function DashboardSidebar({ user }: { user: SidebarUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [openChats, setOpenChats] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isAdminRoute = pathname.startsWith("/dashboard/administration");

  const displayName = user.full_name?.trim() || user.email?.split("@")[0] || "You";
  const initials = displayName.slice(0, 2).toUpperCase();

  const signOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSigningOut(false);
      toast.error("Could not sign out. Try again.");
      return;
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="px-5 py-5">
        <Link href="/dashboard" className="group flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-foreground font-semibold text-background">
            T
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">Taskly</p>
            <p className="truncate text-xs text-muted-foreground">Personal workspace</p>
          </div>
        </Link>
      </div>

      {/* Workspace nav — hidden when in Administration module */}
      {!isAdminRoute && (
        <div className="px-3">
          <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            Workspace
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;
              const isOpen = item.dropdownType === "chats" ? openChats : false;

              return (
                <div key={item.href}>
                  {item.hasDropdown ? (
                    <button
                      type="button"
                      onClick={() => setOpenChats((prev) => !prev)}
                      className={`group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon size={16} strokeWidth={1.75} />
                        {item.name}
                      </span>
                      <ChevronDown size={16} className={`${isOpen ? "rotate-180" : ""} transition`} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.75} />
                      {item.name}
                    </Link>
                  )}

                  {item.hasDropdown && isOpen && (
                    <div className="mt-1 space-y-1 pl-8">
                      <Link
                        href="/dashboard/chats"
                        className={`block rounded-lg px-3 py-2 text-sm transition ${
                          pathname === "/dashboard/chats"
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        My Chats
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}

      {/* Administration nav — only shown when in Administration module */}
      {isAdminRoute && (
        <div className="px-3">
          <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            Administration
          </p>
          <nav className="space-y-0.5">
            {adminItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* User Section */}
      <div className="mt-auto border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
