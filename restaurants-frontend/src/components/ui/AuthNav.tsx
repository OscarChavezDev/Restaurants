'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, UserPlus, LayoutDashboard, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { UserProfileModal } from '@/components/ui/UserProfileModal';

/**
 * Controles de sesión para las cabeceras públicas (home, listado).
 * - Sin sesión: "Iniciar Sesión" + "Registrarse".
 * - Con sesión: saludo + (Panel si es staff) + "Cerrar sesión".
 * Pensado para fondos oscuros/naranjas (texto blanco translúcido).
 */
export function AuthNav() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Evita el parpadeo "logueado/no logueado" antes de rehidratar.
  if (!hasHydrated) return <div className="h-9 w-px" aria-hidden />;

  const ghost =
    'inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/30 bg-white/50 dark:bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/20 transition-all duration-200';
  const solid =
    'inline-flex items-center gap-1.5 rounded-xl bg-orange-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-orange-600 shadow-sm hover:bg-orange-700 dark:hover:bg-orange-50 transition-all duration-200';

  if (isAuthenticated && user) {
    const isStaff = user.role === 'ADMIN' || user.role === 'RESTAURANTE_OWNER' || user.role === 'DEVELOPER';
    const handleLogout = () => {
      logout();
      toast.success('Sesión cerrada');
      router.push('/');
    };
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-white/90">
          Hola, {user.fullName?.split(' ')[0] ?? 'cliente'}
        </span>
        {isStaff ? (
          <Link href="/dashboard" className={ghost}>
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Panel</span>
          </Link>
        ) : (
          <>
            <button onClick={() => setIsProfileModalOpen(true)} className={ghost}>
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Mi Perfil</span>
            </button>
            <UserProfileModal 
              isOpen={isProfileModalOpen} 
              onClose={() => setIsProfileModalOpen(false)} 
            />
          </>
        )}
        <button type="button" onClick={handleLogout} className={solid}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Botón de clientes */}
      <Link
        href="/login"
        className="group inline-flex flex-col items-center gap-0 rounded-xl border border-gray-200 dark:border-white/30 bg-white/60 dark:bg-white/10 backdrop-blur-sm px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-white/20 transition-all duration-200 shadow-sm dark:shadow-none"
      >
        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
          <LogIn className="h-4 w-4" />
          Iniciar Sesión
        </span>
        <span className="text-[10px] text-gray-500 dark:text-white/60 font-medium -mt-0.5 hidden sm:block">
          Para clientes
        </span>
      </Link>

      {/* Botón de restaurantes */}
      <Link
        href="/register"
        className="group inline-flex flex-col items-center gap-0 rounded-xl bg-orange-600 dark:bg-orange-500 px-4 py-1.5 shadow-sm hover:bg-orange-700 dark:hover:bg-orange-400 transition-all duration-200"
      >
        <span className="flex items-center gap-1.5 text-sm font-bold text-white dark:text-white">
          <UserPlus className="h-4 w-4" />
          Registrar restaurante
        </span>
        <span className="text-[10px] text-orange-200 dark:text-orange-100 font-medium -mt-0.5 hidden sm:block">
          Para propietarios
        </span>
      </Link>
    </div>
  );
}
