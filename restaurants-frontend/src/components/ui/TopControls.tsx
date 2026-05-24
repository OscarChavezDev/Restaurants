'use client';

import { Sun, Moon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export function TopControls() {
  const pathname = usePathname();
  const { theme, lang, toggleTheme, setLang } = useUiStore();
  const isDark = theme === 'dark';

  // Dashboard has its own top bar with these controls
  if (pathname.startsWith('/dashboard')) return null;

  return (
    <div className="fixed top-3 right-4 z-50 flex items-center gap-1.5">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
          isDark
            ? 'bg-gray-700/90 text-yellow-300 hover:bg-gray-600 border border-gray-600'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white border border-white/60 shadow-md'
        )}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Language toggle with flags */}
      <div className={cn(
        'flex items-center rounded-lg overflow-hidden border text-xs font-semibold shadow-md',
        isDark ? 'border-gray-600 bg-gray-700/90' : 'border-white/60 bg-white/80 backdrop-blur-sm'
      )}>
        <button
          onClick={() => setLang('es')}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 transition-colors',
            lang === 'es'
              ? 'bg-orange-500 text-white'
              : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-50'
          )}
          title="Español"
        >
          <span className="text-sm leading-none">🇵🇪</span>
          <span>ES</span>
        </button>
        <button
          onClick={() => setLang('en')}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 transition-colors',
            lang === 'en'
              ? 'bg-orange-500 text-white'
              : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-50'
          )}
          title="English"
        >
          <span className="text-sm leading-none">🇺🇸</span>
          <span>EN</span>
        </button>
      </div>
    </div>
  );
}
