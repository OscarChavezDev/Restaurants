'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, UserPlus, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

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

  // Evita el parpadeo "logueado/no logueado" antes de rehidratar.
  if (!hasHydrated) return <div className="h-9 w-px" aria-hidden />;

  const ghost =
    'inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all duration-200';
  const solid =
    'inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow-sm hover:bg-orange-50 transition-all duration-200';

  if (isAuthenticated && user) {
    const isStaff = user.role === 'ADMIN' || user.role === 'RESTAURANTE_OWNER';
    const handleLogout = () => {
      logout();
      toast.success('Sesión cerrada');
      router.push('/');
    };
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-sm font-medium text-white/90">
          Hola, {user.fullName?.split(' ')[0] ?? 'cliente'}
        </span>
        {isStaff && (
          <Link href="/dashboard" className={ghost}>
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Panel</span>
          </Link>
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
      <Link href="/login" className={ghost} title="Los clientes ingresan con su cuenta de Google">
        <LogIn className="h-4 w-4" />
        Iniciar Sesión
      </Link>
      <Link
        href="/register"
        className={solid}
        title="El registro es solo para restaurantes. Si eres cliente, ingresa con Google."
      >
        <UserPlus className="h-4 w-4" />
        Registrar <span className="hidden sm:inline">restaurante</span>
      </Link>
    </div>
  );
}
