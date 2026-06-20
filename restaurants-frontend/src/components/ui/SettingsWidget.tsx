'use client';

import { useState } from 'react';
import { Settings, Sun, Moon, Globe, X } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export function SettingsWidget() {
  const [open, setOpen] = useState(false);
  const { theme, lang, toggleTheme, setLang } = useUiStore();
  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Panel */}
      {open && (
        <div className={cn(
          'mb-1 w-52 rounded-2xl border shadow-xl p-4 space-y-4 transition-all',
          isDark
            ? 'bg-[#211C17] border-[#352D25] text-[#F5F1EA]'
            : 'bg-white border-[#E7E1D8] text-[#1C1917]'
        )}>
          {/* Theme */}
          <div>
            <p className={cn('text-xs font-semibold mb-2 uppercase tracking-wide', isDark ? 'text-[#8A827A]' : 'text-[#78716C]')}>
              {lang === 'es' ? 'Tema' : 'Theme'}
            </p>
            <div className={cn(
              'flex rounded-xl overflow-hidden border',
              isDark ? 'border-[#44403C]' : 'border-[#E7E1D8]'
            )}>
              <button
                onClick={() => !isDark || toggleTheme()}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
                  !isDark
                    ? 'bg-orange-500 text-white'
                    : 'hover:bg-[#2C251E] text-[#A8A29E]'
                )}
              >
                <Sun className="h-3.5 w-3.5" />
                {lang === 'es' ? 'Claro' : 'Light'}
              </button>
              <button
                onClick={() => isDark || toggleTheme()}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
                  isDark
                    ? 'bg-[#F97A3D] text-white'
                    : 'hover:bg-gray-100 text-[#78716C]'
                )}
              >
                <Moon className="h-3.5 w-3.5" />
                {lang === 'es' ? 'Oscuro' : 'Dark'}
              </button>
            </div>
          </div>

          {/* Language */}
          <div>
            <p className={cn('text-xs font-semibold mb-2 uppercase tracking-wide flex items-center gap-1', isDark ? 'text-[#8A827A]' : 'text-[#78716C]')}>
              <Globe className="h-3 w-3" />
              {lang === 'es' ? 'Idioma' : 'Language'}
            </p>
            <div className={cn(
              'flex rounded-xl overflow-hidden border',
              isDark ? 'border-[#44403C]' : 'border-[#E7E1D8]'
            )}>
              <button
                onClick={() => setLang('es')}
                className={cn(
                  'flex-1 py-2 text-xs font-medium transition-colors',
                  lang === 'es'
                    ? isDark ? 'bg-[#F97A3D] text-white' : 'bg-orange-500 text-white'
                    : isDark ? 'hover:bg-[#2C251E] text-[#A8A29E]' : 'hover:bg-gray-100 text-[#78716C]'
                )}
              >
                Español
              </button>
              <button
                onClick={() => setLang('en')}
                className={cn(
                  'flex-1 py-2 text-xs font-medium transition-colors',
                  lang === 'en'
                    ? isDark ? 'bg-[#F97A3D] text-white' : 'bg-orange-500 text-white'
                    : isDark ? 'hover:bg-[#2C251E] text-[#A8A29E]' : 'hover:bg-gray-100 text-[#78716C]'
                )}
              >
                English
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200',
          open
            ? isDark ? 'bg-[#2C251E] text-[#F5F1EA] rotate-90' : 'bg-[#1C1917] text-white rotate-90'
            : isDark
              ? 'bg-[#2C251E] text-[#F5F1EA] hover:bg-[#352D25]'
              : 'bg-white text-[#78716C] border border-[#E7E1D8] hover:bg-[#F4F0EA]'
        )}
        title={lang === 'es' ? 'Configuración' : 'Settings'}
      >
        {open ? <X className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
      </button>
    </div>
  );
}
