'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed, Calendar, BarChart3, Tag,
  LogOut, Home, Users, X, SlidersHorizontal, ClipboardCheck, Wallet, QrCode,
  LayoutDashboard, ShieldCheck, KeyRound, PanelLeftClose, PanelLeftOpen, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/utils/cn';
import { BrandMark } from '@/components/ui/BrandMark';

const navItems = [
  { href: '/dashboard',              icon: Home,           labelKey: 'home',         roles: ['ADMIN', 'RESTAURANTE_OWNER', 'CLIENTE'] },
  { href: '/dashboard/restaurants',  icon: UtensilsCrossed, labelKey: 'restaurants', roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/reservas-config', icon: SlidersHorizontal, labelKey: 'reservationConfig', roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/menus',        icon: UtensilsCrossed, labelKey: 'menus',        roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/promotions',   icon: Tag,             labelKey: 'promotions',   roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/pagos',        icon: Wallet,          labelKey: 'payments',     roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/reservations', icon: Calendar,        labelKey: 'reservations', roles: ['ADMIN', 'RESTAURANTE_OWNER', 'CLIENTE'] },
  { href: '/dashboard/llegadas',     icon: QrCode,          labelKey: 'arrivals',     roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/reports',      icon: BarChart3,       labelKey: 'reports',      roles: ['ADMIN', 'RESTAURANTE_OWNER'] },
  { href: '/dashboard/solicitudes',  icon: ClipboardCheck,  labelKey: 'registrationRequests', roles: ['ADMIN'] },
  { href: '/dashboard/users',        icon: Users,           labelKey: 'users',        roles: ['ADMIN'] },
  { href: '/dashboard/admin',        icon: LayoutDashboard, labelKey: 'adminPanel',   roles: ['ADMIN'] },
  { href: '/dashboard/auditoria',    icon: ShieldCheck,     labelKey: 'auditLogs',    roles: ['ADMIN'] },
  { href: '/dashboard/api-keys',     icon: KeyRound,       labelKey: 'apiKeys',      roles: ['DEVELOPER', 'RESTAURANTE_OWNER'] },
] as const;

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: ['/dashboard']
  },
  {
    label: 'Gestión',
    items: ['/dashboard/restaurants', '/dashboard/menus', '/dashboard/reservas-config', '/dashboard/promotions']
  },
  {
    label: 'Operaciones',
    items: ['/dashboard/reservations', '/dashboard/pagos', '/dashboard/llegadas', '/dashboard/reports']
  },
  {
    label: 'Administración',
    items: ['/dashboard/solicitudes', '/dashboard/users', '/dashboard/admin', '/dashboard/auditoria']
  },
  {
    label: 'Desarrolladores',
    items: ['/dashboard/api-keys']
  }
];

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
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
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col transition-[width,transform] duration-300',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-20' : 'w-64',
          isDark
            ? 'bg-[#15120E] text-[#F5F1EA]'
            : 'bg-[#FDFBF7] text-[#1C1917] border-r border-[#E7E1D8]'
        )}
      >
      {/* Logo */}
      <div className={cn(
        'flex p-4 border-b transition-all',
        isCollapsed ? 'flex-col items-center justify-center gap-4' : 'flex-row items-center gap-3',
        isDark ? 'border-[#352D25]' : 'border-[#E7E1D8]'
      )}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0 bg-transparent">
          <BrandMark className="h-9 w-9 drop-shadow-sm" />
        </div>
        
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm leading-tight">Resto<span className="text-orange-500">Point</span></p>
            <p className={cn(
              'text-xs',
              isDark ? 'text-[#8A827A]' : 'text-[#78716C]'
            )}>Tingo María</p>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'hidden lg:flex p-1.5 rounded-lg transition-colors shrink-0',
            !isCollapsed && 'ml-auto',
            isDark
              ? 'text-[#A8A29E] hover:bg-[#2C251E] hover:text-[#F5F1EA]'
              : 'text-[#78716C] hover:bg-gray-200/50 hover:text-[#1C1917]'
          )}
          aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>

        {/* Mobile Close Toggle */}
        <button
          onClick={onClose}
          className={cn(
            'lg:hidden p-1.5 rounded-lg transition-colors',
            isDark
              ? 'text-[#8A827A] hover:bg-[#2C251E] hover:text-[#F5F1EA]'
              : 'text-[#78716C] hover:bg-gray-200/50 hover:text-[#1C1917]'
          )}
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav (solo hace scroll si realmente no entra) */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {NAV_GROUPS.map((group) => {
          const groupItems = visible.filter(item => group.items.includes(item.href));
          
          if (groupItems.length === 0) return null;
          
          return (
            <div key={group.label} className="flex flex-col gap-1">
              {!isCollapsed && (
                <div className={cn(
                  "px-3 mb-1 text-[10px] font-bold uppercase tracking-wider",
                  isDark ? "text-[#8A827A]" : "text-[#A8A29E]"
                )}>
                  {group.label}
                </div>
              )}
              
              {groupItems.map((item) => {
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-tour={`nav-${item.labelKey}`}
                    className={cn(
                      'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                      isCollapsed ? 'justify-center' : 'gap-3',
                      isActive
                        ? isDark
                          ? 'bg-[#F97A3D] text-white shadow-lg shadow-orange-500/20'
                          : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : isDark
                          ? 'text-[#A8A29E] hover:bg-[#2C251E] hover:text-[#F5F1EA]'
                          : 'text-[#78716C] hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E7E1D8] hover:text-[#1C1917]'
                    )}
                    title={isCollapsed ? t(item.labelKey) : undefined}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-white" : isDark ? "text-[#8A827A] group-hover:text-[#F5F1EA]" : "text-[#A8A29E] group-hover:text-[#1C1917]"
                    )} />
                    {!isCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                        {t(item.labelKey)}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
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
            'flex items-center mb-3 rounded-xl py-2 transition-colors group',
            isCollapsed ? 'justify-center px-0' : 'gap-3 px-2',
            pathname === '/dashboard/profile'
              ? isDark ? 'bg-[#2C251E]' : 'bg-[#F4F0EA]'
              : isDark ? 'hover:bg-[#2C251E]' : 'hover:bg-[#F4F0EA]'
          )}
          title={isCollapsed ? 'Editar perfil' : undefined}
        >
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold flex-shrink-0 group-hover:ring-2 transition-all text-white',
            isDark
              ? 'bg-[#F97A3D] group-hover:ring-[#FB8C5A]'
              : 'bg-orange-500 group-hover:ring-orange-400'
          )}>
            {user?.fullName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className={cn(
                'text-xs truncate transition-colors',
                isDark
                  ? 'text-[#8A827A] group-hover:text-[#FB8C5A]'
                  : 'text-[#78716C] group-hover:text-orange-500'
              )}>Editar perfil</p>
            </div>
          )}
        </Link>
        <button
          onClick={() => setConfirmLogout(true)}
          className={cn(
            'flex w-full items-center rounded-xl py-2 text-sm transition-colors',
            isCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
            isDark
              ? 'text-[#A8A29E] hover:bg-[#2C251E] hover:text-[#F5F1EA]'
              : 'text-[#78716C] hover:bg-[#F4F0EA] hover:text-[#1C1917]'
          )}
          title={isCollapsed ? t('logout') : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>{t('logout')}</span>}
        </button>
      </div>
      </aside>

      {confirmLogout && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmLogout(false)}>
          <div
            className={cn(
              'relative max-w-sm w-full rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200',
              isDark ? 'bg-[#211C17] border border-[#352D25]' : 'bg-white border border-gray-100'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={cn('font-display text-lg font-bold flex items-center gap-2 mb-2', isDark ? 'text-[#F5F1EA]' : 'text-gray-900')}>
              <AlertTriangle className="h-5 w-5 text-orange-500" /> ¿Cerrar sesión?
            </h3>
            <p className={cn('text-sm mb-5', isDark ? 'text-[#A8A29E]' : 'text-gray-500')}>
              Tendrás que iniciar sesión de nuevo para volver a acceder al panel.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmLogout(false)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-xl transition-colors',
                  isDark ? 'text-[#A8A29E] hover:bg-[#2C251E]' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                Cancelar
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
