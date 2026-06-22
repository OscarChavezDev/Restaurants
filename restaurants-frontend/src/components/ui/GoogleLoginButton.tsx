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
      <p className="text-xs text-amber-600 text-center">
        Login con Google no configurado (falta NEXT_PUBLIC_GOOGLE_CLIENT_ID).
      </p>
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
