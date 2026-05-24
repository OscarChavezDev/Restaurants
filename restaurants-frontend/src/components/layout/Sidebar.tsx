'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed, Calendar, BarChart3, Tag,
  LogOut, Home, Users
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/utils/cn';

const navItems = [
  { href: '/dashboard',              icon: Home,           labelKey: 'home',         roles: ['ADMIN', 'RESTAURANTE_OWNER', 'CLIENTE'] },
  { href: '/dashboard/restaurants',  icon: UtensilsCrossed, labelKey: 'restaurants', roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/reservations', icon: Calendar,        labelKey: 'reservations', roles: ['ADMIN', 'RESTAURANTE_OWNER', 'CLIENTE'] },
  { href: '/dashboard/menus',        icon: UtensilsCrossed, labelKey: 'menus',        roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/promotions',   icon: Tag,             labelKey: 'promotions',   roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/reports',      icon: BarChart3,       labelKey: 'reports',      roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/users',        icon: Users,           labelKey: 'users',        roles: ['ADMIN'] },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const t = useTranslation();

  const visible = navItems.filter((item) =>
    user ? item.roles.includes(user.role as never) : false
  );

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-700">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-lg flex-shrink-0">
          <UtensilsCrossed className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="font-display font-semibold text-sm leading-tight">Restaurants</p>
          <p className="text-xs text-gray-400">Tingo María</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {visible.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-700 p-4">
        <Link
          href="/dashboard/profile"
          className={cn(
            'flex items-center gap-3 mb-3 rounded-xl px-2 py-2 transition-colors group',
            pathname === '/dashboard/profile'
              ? 'bg-gray-800'
              : 'hover:bg-gray-800'
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold flex-shrink-0 group-hover:ring-2 group-hover:ring-orange-400 transition-all">
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 truncate group-hover:text-orange-400 transition-colors">Editar perfil</p>
          </div>
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
