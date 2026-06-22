'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

const pad = (n: number) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = ['00', '10', '20', '30', '40', '50'];

function parse(value?: string | null): { h12: number; min: string; ampm: 'AM' | 'PM' } {
  if (!value) return { h12: 9, min: '00', ampm: 'AM' };
  const [hStr, mStr] = value.split(':');
  const h = parseInt(hStr, 10);
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { h12, min: (mStr ?? '00').padStart(2, '0'), ampm };
}

function compose(h12: number, min: string, ampm: 'AM' | 'PM'): string {
  let h = h12 % 12;
  if (ampm === 'PM') h += 12;
  return `${pad(h)}:${min}`;
}

function label(value?: string | null): string {
  if (!value) return '--:--';
  const { h12, min, ampm } = parse(value);
  return `${h12}:${min} ${ampm === 'PM' ? 'p. m.' : 'a. m.'}`;
}

/**
 * Selector de hora propio en formato 12h (a.m./p.m.) con minutos de 10 en 10.
 * El popover se renderiza en un portal con posición fija para que NO se recorte
 * dentro de contenedores con overflow (p. ej. el modal de reserva).
 * Guarda el valor en 24h "HH:mm" para el backend.
 */
export function TimePicker({
  value,
  onChange,
  className,
  fullWidth = false,
}: {
  value?: string | null;
  onChange: (value: string) => void;
  className?: string;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const { h12, min, ampm } = parse(value);

  // Posiciona el popover respecto al trigger (fixed → no lo recorta ningún overflow).
  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 224; // w-56
    const popH = 250;
    let left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    const openUp = r.bottom + popH > window.innerHeight && r.top - popH > 8;
    const top = openUp ? r.top - popH - 4 : r.bottom + 4;
    setPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
  }, []);

  const Cell = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg py-1.5 text-sm font-medium transition-all active:scale-90',
        active
          ? 'bg-orange-500 text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-500/15 hover:text-orange-600'
      )}
    >
      {children}
    </button>
  );

  return (
    <div ref={wrapRef} className={cn('relative', fullWidth ? 'block w-full' : 'inline-block')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 tabular-nums hover:border-orange-300 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500',
          fullWidth && 'w-full',
          className
        )}
      >
        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span>{label(value)}</span>
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          className="z-[100] rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl p-3 animate-pop-in"
        >
          {/* AM / PM */}
          <div className="flex gap-1 mb-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
            {(['AM', 'PM'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange(compose(h12, min, p))}
                className={cn(
                  'flex-1 rounded-lg py-1.5 text-sm font-semibold transition-all active:scale-95',
                  ampm === p ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
                )}
              >
                {p === 'AM' ? 'a. m.' : 'p. m.'}
              </button>
            ))}
          </div>

          {/* Horas */}
          <p className="text-[11px] font-medium text-gray-400 mb-1 px-0.5">Hora</p>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {HOURS.map((h) => (
              <Cell key={h} active={h === h12} onClick={() => onChange(compose(h, min, ampm))}>{h}</Cell>
            ))}
          </div>

          {/* Minutos */}
          <p className="text-[11px] font-medium text-gray-400 mb-1 px-0.5">Minutos</p>
          <div className="grid grid-cols-6 gap-1">
            {MINUTES.map((m) => (
              <Cell key={m} active={m === min} onClick={() => onChange(compose(h12, m, ampm))}>{m}</Cell>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
