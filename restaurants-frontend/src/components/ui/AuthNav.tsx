'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, UserPlus, LayoutDashboard, User as UserIcon, AlertTriangle } from 'lucide-react';
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
  const [confirmLogout, setConfirmLogout] = useState(false);

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
        <button type="button" onClick={() => setConfirmLogout(true)} className={solid}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>

        {confirmLogout && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmLogout(false)}>
            <div
              className="relative max-w-sm w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" /> ¿Cerrar sesión?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Tendrás que iniciar sesión de nuevo para volver a acceder a tu cuenta.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={() => setConfirmLogout(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  <LogOut className="h-4 w-4" /> Sí, cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Botón de clientes */}
      <Link
        href="/login"
        className="group inline-flex flex-col items-center gap-0 rounded-xl border border-gray-200 dark:border-white/30 bg-white/60 dark:bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-white/20 transition-all duration-200 shadow-sm dark:shadow-none"
      >
        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Iniciar Sesión</span>
        </span>
        <span className="text-[10px] text-gray-500 dark:text-white/60 font-medium -mt-0.5 hidden sm:block">
          Para clientes
        </span>
      </Link>

      {/* Botón de restaurantes */}
      <Link
        href="/register"
        className="group inline-flex flex-col items-center gap-0 rounded-xl bg-orange-600 dark:bg-orange-500 px-3 sm:px-4 py-1.5 shadow-sm hover:bg-orange-700 dark:hover:bg-orange-400 transition-all duration-200"
      >
        <span className="flex items-center gap-1.5 text-sm font-bold text-white dark:text-white">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Registrar restaurante</span>
        </span>
        <span className="text-[10px] text-orange-200 dark:text-orange-100 font-medium -mt-0.5 hidden sm:block">
          Para propietarios
        </span>
      </Link>
    </div>
  );
}
