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

function formatLabel(value?: string | null): string {
  if (!value) return '--:--';
  const { h12, min, ampm } = parse(value);
  return `${h12}:${min} ${ampm === 'PM' ? 'pm' : 'am'}`;
}

/**
 * Selector de hora compacto en formato 12h.
 * Renderiza el popover como portal fijo para no recortarse.
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

  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 224;
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
        'rounded-xl py-1.5 text-sm font-bold transition-all active:scale-90',
        active
          ? 'bg-orange-500 text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400'
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
          'inline-flex items-center gap-2 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-bold bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 tabular-nums whitespace-nowrap hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500',
          fullWidth && 'w-full justify-center',
          className
        )}
      >
        <Clock className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
        <span>{formatLabel(value)}</span>
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          className="z-[100] rounded-[2rem] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 shadow-2xl p-4 animate-pop-in"
        >
          {/* AM / PM */}
          <div className="flex gap-1.5 mb-3 p-1.5 bg-gray-100/50 dark:bg-neutral-800/50 border border-gray-200/50 dark:border-neutral-700/50 rounded-2xl">
            {(['AM', 'PM'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange(compose(h12, min, p))}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm font-bold transition-all active:scale-95',
                  ampm === p ? 'bg-white dark:bg-neutral-700 text-orange-600 dark:text-orange-400 shadow-sm border border-gray-200 dark:border-neutral-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-neutral-700/50'
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
