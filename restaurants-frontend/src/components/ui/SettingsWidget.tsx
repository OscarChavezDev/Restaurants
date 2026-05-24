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
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        )}>
          {/* Theme */}
          <div>
            <p className={cn('text-xs font-semibold mb-2 uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
              {lang === 'es' ? 'Tema' : 'Theme'}
            </p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => !isDark || toggleTheme()}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
                  !isDark ? 'bg-orange-500 text-white' : 'hover:bg-gray-700 text-gray-300'
                )}
              >
                <Sun className="h-3.5 w-3.5" />
                {lang === 'es' ? 'Claro' : 'Light'}
              </button>
              <button
                onClick={() => isDark || toggleTheme()}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
                  isDark ? 'bg-orange-500 text-white' : 'hover:bg-gray-100 text-gray-600'
                )}
              >
                <Moon className="h-3.5 w-3.5" />
                {lang === 'es' ? 'Oscuro' : 'Dark'}
              </button>
            </div>
          </div>

          {/* Language */}
          <div>
            <p className={cn('text-xs font-semibold mb-2 uppercase tracking-wide flex items-center gap-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
              <Globe className="h-3 w-3" />
              {lang === 'es' ? 'Idioma' : 'Language'}
            </p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setLang('es')}
                className={cn(
                  'flex-1 py-2 text-xs font-medium transition-colors',
                  lang === 'es' ? 'bg-orange-500 text-white' : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                )}
              >
                Español
              </button>
              <button
                onClick={() => setLang('en')}
                className={cn(
                  'flex-1 py-2 text-xs font-medium transition-colors',
                  lang === 'en' ? 'bg-orange-500 text-white' : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
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
            ? 'bg-gray-700 text-white rotate-90'
            : isDark
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        )}
        title={lang === 'es' ? 'Configuración' : 'Settings'}
      >
        {open ? <X className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
      </button>
    </div>
  );
}
