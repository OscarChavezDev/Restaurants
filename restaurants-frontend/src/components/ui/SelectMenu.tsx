'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Option { value: string; label: string }

/** Dropdown propio (reemplaza el <select> nativo) coherente en claro/oscuro y con la paleta. */
export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', esc); };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-orange-300 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500',
          className
        )}
      >
        <span className={selected ? 'text-gray-700' : 'text-gray-400'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl py-1 max-h-60 overflow-auto animate-pop-in">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value || 'none'}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors',
                  active ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <span className="truncate">{o.label}</span>
                {active && <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
