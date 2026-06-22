import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, UserRole } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** true una vez que el store se rehidrató desde localStorage (evita falsos "no logueado" tras F5). */
  hasHydrated: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isOwner: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setUser: (user) =>
        set({
          user,
          accessToken: user.accessToken,
          isAuthenticated: true,
        }),

      setHasHydrated: (v) => set({ hasHydrated: v }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),

      hasRole: (role) => get().user?.role === role,

      isAdmin: () => get().user?.role === 'ADMIN',

      isOwner: () =>
        get().user?.role === 'ADMIN' || get().user?.role === 'RESTAURANTE_OWNER',
    }),
    {
      name: 'restaurants-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as any)
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
