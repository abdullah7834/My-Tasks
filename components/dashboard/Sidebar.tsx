'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Clock, List, Settings, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Today', href: '/today', icon: Clock },
  { name: 'Upcoming', href: '/upcoming', icon: Calendar },
  { name: 'All Tasks', href: '/tasks', icon: List },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 border-r border-zinc-200 bg-white flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
            T
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900">Taskly</h2>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === `/dashboard${item.href === '/' ? '' : item.href}`;
          return (
            <Link
              key={item.name}
              href={`/dashboard${item.href}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'hover:bg-zinc-100 text-zinc-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button className="flex items-center gap-3 text-red-600 hover:bg-red-50 w-full px-4 py-3 rounded-2xl transition-colors">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}