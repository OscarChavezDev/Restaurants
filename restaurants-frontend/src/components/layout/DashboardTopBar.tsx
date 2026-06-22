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
        ? 'bg-[#15120E] border-[#352D25]'
        : 'bg-white border-[#E7E1D8]'
    )}>
      {/* Hamburguesa (solo móvil) */}
      <button
        onClick={onMenuClick}
        className={cn(
          'lg:hidden flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
          isDark ? 'text-[#A8A29E] hover:bg-[#2C251E]' : 'text-[#78716C] hover:bg-gray-100'
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
              ? 'bg-[#2C251E] text-yellow-300 hover:bg-[#352D25]'
              : 'text-[#78716C] hover:bg-gray-100'
          )}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        {/* Language toggle with flags */}
        <div className={cn(
          'flex items-center rounded-lg overflow-hidden border text-xs font-semibold',
          isDark ? 'border-[#44403C] bg-[#2C251E]' : 'border-[#E7E1D8] bg-[#F4F0EA]'
        )}>
          <button
            onClick={() => setLang('es')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 transition-colors',
              lang === 'es'
                ? isDark ? 'bg-[#F97A3D] text-white' : 'bg-orange-500 text-white'
                : isDark ? 'text-[#A8A29E] hover:bg-[#352D25]' : 'text-[#78716C] hover:bg-gray-100'
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
                ? isDark ? 'bg-[#F97A3D] text-white' : 'bg-orange-500 text-white'
                : isDark ? 'text-[#A8A29E] hover:bg-[#352D25]' : 'text-[#78716C] hover:bg-gray-100'
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
