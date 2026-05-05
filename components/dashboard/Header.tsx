'use client';

import { User } from '@supabase/supabase-js';
import { Bell, Search } from 'lucide-react';

interface DashboardHeaderProps {
  user: User;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-200 bg-white px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full bg-zinc-100 border border-transparent focus:border-zinc-300 pl-10 py-2.5 rounded-2xl text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors relative">
          <Bell className="w-5 h-5 text-zinc-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-900">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
          <div className="w-9 h-9 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-semibold">
            {user.email?.[0].toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}