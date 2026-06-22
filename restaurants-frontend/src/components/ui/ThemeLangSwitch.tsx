'use client';

import { Sun, Moon } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

// Controles de tema + idioma. Reutilizable: flotante (TopControls) o inline
// dentro de un navbar (home) para evitar solapamientos.
export function ThemeLangSwitch() {
  const { theme, lang, toggleTheme, setLang } = useUiStore();
  const isDark = theme === 'dark';

  const glass = isDark ? 'bg-[#211C17]/85 border-[#3A3128]' : 'bg-white/85 border-white/60';

  return (
    <div className="flex items-center gap-1.5">
      {/* Tema */}
      <button
        onClick={toggleTheme}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md shadow-sm transition-colors',
          glass,
          isDark ? 'text-amber-300 hover:bg-[#2C251E]' : 'text-gray-600 hover:bg-white'
        )}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Idioma */}
      <div className={cn('flex items-center rounded-lg overflow-hidden border backdrop-blur-md shadow-sm text-xs font-semibold', glass)}>
        <button
          onClick={() => setLang('es')}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 transition-colors',
            lang === 'es' ? 'bg-orange-500 text-white' : isDark ? 'text-gray-300 hover:bg-[#2C251E]' : 'text-gray-600 hover:bg-gray-100'
          )}
          title="Español"
        >
          <span>ES</span>
        </button>
        <button
          onClick={() => setLang('en')}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 transition-colors',
            lang === 'en' ? 'bg-orange-500 text-white' : isDark ? 'text-gray-300 hover:bg-[#2C251E]' : 'text-gray-600 hover:bg-gray-100'
          )}
          title="English"
        >
          <span>EN</span>
        </button>
      </div>
    </div>
  );
}
