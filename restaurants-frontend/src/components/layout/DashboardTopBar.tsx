'use client';

import { Sun, Moon } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export function DashboardTopBar() {
  const { theme, lang, toggleTheme, setLang } = useUiStore();
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      'flex h-11 items-center justify-end px-6 border-b shrink-0',
      isDark
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-100'
    )}>
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
            isDark
              ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600'
              : 'text-gray-500 hover:bg-gray-100'
          )}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Language toggle with flags */}
        <div className={cn(
          'flex items-center rounded-lg overflow-hidden border text-xs font-semibold',
          isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
        )}>
          <button
            onClick={() => setLang('es')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 transition-colors',
              lang === 'es'
                ? 'bg-orange-500 text-white'
                : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-100'
            )}
            title="Español"
          >
            <span className="text-sm leading-none">🇵🇪</span>
            <span>ES</span>
          </button>
          <button
            onClick={() => setLang('en')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 transition-colors',
              lang === 'en'
                ? 'bg-orange-500 text-white'
                : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-500 hover:bg-gray-100'
            )}
            title="English"
          >
            <span className="text-sm leading-none">🇺🇸</span>
            <span>EN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
