'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed, Calendar, BarChart3, Tag,
  LogOut, Home, Users, X, SlidersHorizontal, ClipboardCheck, Wallet, QrCode,
  LayoutDashboard, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/utils/cn';

const navItems = [
  { href: '/dashboard',              icon: Home,           labelKey: 'home',         roles: ['ADMIN', 'RESTAURANTE_OWNER', 'CLIENTE'] },
  { href: '/dashboard/restaurants',  icon: UtensilsCrossed, labelKey: 'restaurants', roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/reservations', icon: Calendar,        labelKey: 'reservations', roles: ['ADMIN', 'RESTAURANTE_OWNER', 'CLIENTE'] },
  { href: '/dashboard/llegadas',     icon: QrCode,          labelKey: 'arrivals',     roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/menus',        icon: UtensilsCrossed, labelKey: 'menus',        roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/promotions',   icon: Tag,             labelKey: 'promotions',   roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/reservas-config', icon: SlidersHorizontal, labelKey: 'reservationConfig', roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/pagos',        icon: Wallet,          labelKey: 'payments',     roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/reports',      icon: BarChart3,       labelKey: 'reports',      roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/solicitudes',  icon: ClipboardCheck,  labelKey: 'registrationRequests', roles: ['ADMIN'] },
  { href: '/dashboard/users',        icon: Users,           labelKey: 'users',        roles: ['ADMIN'] },
  { href: '/dashboard/admin',        icon: LayoutDashboard, labelKey: 'adminPanel',   roles: ['ADMIN'] },
  { href: '/dashboard/auditoria',    icon: ShieldCheck,     labelKey: 'auditLogs',    roles: ['ADMIN'] },
] as const;

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';
  const t = useTranslation();

  const visible = navItems.filter((item) =>
    user ? item.roles.includes(user.role as never) : false
  );

  return (
    <>
      {/* Overlay (solo móvil) */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col transition-transform duration-300',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          isDark
            ? 'bg-[#15120E] text-[#F5F1EA]'
            : 'bg-white text-[#1C1917] shadow-[1px_0_0_0_#E7E1D8]'
        )}
      >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b',
        isDark ? 'border-[#352D25]' : 'border-[#E7E1D8]'
      )}>
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg flex-shrink-0',
          isDark ? 'bg-[#F97A3D]' : 'bg-orange-500'
        )}>
          <UtensilsCrossed className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm leading-tight">Restaurants</p>
          <p className={cn(
            'text-xs',
            isDark ? 'text-[#8A827A]' : 'text-[#78716C]'
          )}>Tingo María</p>
        </div>
        {/* Cerrar (solo móvil) */}
        <button
          onClick={onClose}
          className={cn(
            'lg:hidden p-1.5 rounded-lg transition-colors',
            isDark
              ? 'text-[#8A827A] hover:bg-[#2C251E] hover:text-[#F5F1EA]'
              : 'text-[#78716C] hover:bg-gray-100 hover:text-[#1C1917]'
          )}
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav (solo hace scroll si realmente no entra) */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-0.5">
        {visible.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={`nav-${item.labelKey}`}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? isDark
                    ? 'bg-[#F97A3D] text-white'
                    : 'bg-orange-500 text-white'
                  : isDark
                    ? 'text-[#A8A29E] hover:bg-[#2C251E] hover:text-[#F5F1EA]'
                    : 'text-[#78716C] hover:bg-[#F4F0EA] hover:text-[#1C1917]'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className={cn(
        'border-t p-4',
        isDark ? 'border-[#352D25]' : 'border-[#E7E1D8]'
      )}>
        <Link
          href="/dashboard/profile"
          className={cn(
            'flex items-center gap-3 mb-3 rounded-xl px-2 py-2 transition-colors group',
            pathname === '/dashboard/profile'
              ? isDark ? 'bg-[#2C251E]' : 'bg-[#F4F0EA]'
              : isDark ? 'hover:bg-[#2C251E]' : 'hover:bg-[#F4F0EA]'
          )}
        >
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold flex-shrink-0 group-hover:ring-2 transition-all text-white',
            isDark
              ? 'bg-[#F97A3D] group-hover:ring-[#FB8C5A]'
              : 'bg-orange-500 group-hover:ring-orange-400'
          )}>
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className={cn(
              'text-xs truncate transition-colors',
              isDark
                ? 'text-[#8A827A] group-hover:text-[#FB8C5A]'
                : 'text-[#78716C] group-hover:text-orange-500'
            )}>Editar perfil</p>
          </div>
        </Link>
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
            isDark
              ? 'text-[#A8A29E] hover:bg-[#2C251E] hover:text-[#F5F1EA]'
              : 'text-[#78716C] hover:bg-[#F4F0EA] hover:text-[#1C1917]'
          )}
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </button>
      </div>
      </aside>
    </>
  );
}
