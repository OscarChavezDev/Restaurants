'use client';

import { Sun, Moon, Menu } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export function DashboardTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, lang, toggleTheme, setLang } = useUiStore();
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      'flex h-12 items-center justify-between gap-2 px-4 sm:px-6 border-b shrink-0',
      isDark
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-100'
    )}>
      {/* Hamburguesa (solo móvil) */}
      <button
        onClick={onMenuClick}
        className={cn(
          'lg:hidden flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
          isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
        )}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1.5 ml-auto">
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
            <span>EN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
