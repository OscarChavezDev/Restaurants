'use client';

import { Sun, Moon } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

/** Botón de tema claro/oscuro. El toggle de idioma fue removido — la app es siempre en español. */
export function ThemeLangSwitch() {
  const { theme, toggleTheme } = useUiStore();
  const isDark = theme === 'dark';

  const glass = isDark ? 'bg-[#211C17]/85 border-[#3A3128]' : 'bg-white/85 border-white/60';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md shadow-sm transition-all duration-200 hover:scale-110',
        glass,
        isDark ? 'text-amber-300 hover:bg-[#2C251E]' : 'text-gray-600 hover:bg-white'
      )}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
