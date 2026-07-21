'use client';

import { Sun, Moon, Menu } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export function DashboardTopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, toggleTheme } = useUiStore();
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
      </div>
    </div>
  );
}
