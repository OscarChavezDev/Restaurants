import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark';
export type Lang  = 'es' | 'en';

interface UiState {
  theme: Theme;
  lang:  Lang;
  setTheme: (t: Theme) => void;
  setLang:  (l: Lang)  => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      lang:  'es',
      setTheme:    (theme)  => set({ theme }),
      setLang:     (lang)   => set({ lang }),
      toggleTheme: ()       => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    {
      name: 'restaurants-ui',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as any)
      ),
    }
  )
);
