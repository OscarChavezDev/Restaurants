'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import type { AuthUser } from '@/types/auth';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: any;
  }
}

/** Carga el script de Google Identity Services una sola vez. */
function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject();
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject());
      return;
    }
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });
}

interface Props {
  /** Se ejecuta tras un login exitoso (ej. cerrar modal o redirigir). */
  onSuccess?: (user: AuthUser) => void;
  /** Texto del botón de Google. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

/**
 * Botón oficial "Iniciar sesión con Google". Obtiene el ID token, lo manda al
 * backend (/v1/auth/google) y guarda el usuario (rol CLIENTE) en el authStore.
 */
export function GoogleLoginButton({ onSuccess, text = 'continue_with' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return;
            try {
              setLoading(true);
              const user = await authService.google(response.credential);
              setUser(user);
              toast.success(`¡Hola, ${user.fullName}!`);
              onSuccess?.(user);
            } catch (err: any) {
              toast.error(
                err?.response?.status === 401
                  ? 'No se pudo validar tu cuenta de Google.'
                  : 'Error al iniciar sesión con Google. Intenta de nuevo.'
              );
            } finally {
              setLoading(false);
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text,
          shape: 'pill',
          logo_alignment: 'left',
        });
        setReady(true);
      })
      .catch(() => {
        /* sin conexión a Google: el botón simplemente no aparece */
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        onClick={() => {
          toast.success('¡Ingresaste como Cliente (Modo Demo)!');
          const demoUser: AuthUser = {
            userId: 'demo-client-id',
            fullName: 'Carlos Comensal',
            email: 'cliente.demo@gmail.com',
            role: 'CLIENTE',
            accessToken: 'demo-access-token',
            refreshToken: 'demo-refresh-token',
            expiresIn: 3600,
            tokenType: 'Bearer',
          };
          setUser(demoUser);
          onSuccess?.(demoUser);
        }}
        className="flex items-center justify-center gap-3 w-full py-3 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-full font-semibold text-gray-800 dark:text-gray-100 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
      >
        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Continuar con Google</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} className={loading ? 'opacity-50 pointer-events-none' : ''} />
      {loading && <span className="text-xs text-gray-500">Ingresando…</span>}
      {!ready && !loading && <span className="text-xs text-gray-400">Cargando Google…</span>}
    </div>
  );
}
