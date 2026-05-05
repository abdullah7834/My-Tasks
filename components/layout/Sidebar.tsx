"use client";

import Link from "next/link";
import { Home, LayoutGrid, List, CalendarDays, Plus, FolderPlus } from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderPlus },
  { href: "/board", label: "Board view", icon: LayoutGrid },
  { href: "/list", label: "List view", icon: List },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-950 p-6 lg:flex">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-violet-500 text-white shadow-xl shadow-violet-500/20">
          <Plus size={20} />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Task tracker</p>
          <h1 className="text-lg font-semibold text-white">My workspace</h1>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
