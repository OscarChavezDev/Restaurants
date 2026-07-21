'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, parse, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/utils/cn';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface DatePickerProps {
  /** Formato 'yyyy-MM-dd', igual que <input type="date"> */
  value: string;
  onChange: (value: string) => void;
  /** Fecha mínima seleccionable en formato 'yyyy-MM-dd' */
  min?: string;
  className?: string;
  fullWidth?: boolean;
}

/** Selector de fecha con popover en portal (no se recorta dentro de modales con scroll). */
export function DatePicker({ value, onChange, min, className, fullWidth = false }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;
  const minDate = min ? parse(min, 'yyyy-MM-dd', new Date()) : undefined;
  const [viewMonth, setViewMonth] = useState(() => selected ?? minDate ?? new Date());

  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 300;
    const popH = 380;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
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

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const pickDay = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const isDisabled = (day: Date) => !!minDate && day < minDate && !isSameDay(day, minDate);

  return (
    <div ref={wrapRef} className={cn('relative', fullWidth ? 'block w-full' : 'inline-block')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-2 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-bold bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 whitespace-nowrap hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500',
          fullWidth && 'w-full justify-center',
          className,
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
        <span className="capitalize">{selected ? format(selected, "d 'de' MMMM", { locale: es }) : 'Selecciona fecha'}</span>
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
          className="z-[100] rounded-[2rem] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 shadow-2xl p-4 animate-pop-in"
        >
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-extrabold text-gray-900 dark:text-white capitalize tracking-tight">
              {format(viewMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button type="button" onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="h-7 flex items-center justify-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const isSel = !!selected && isSameDay(day, selected);
              const disabled = isDisabled(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickDay(day)}
                  className={cn(
                    'h-9 w-9 rounded-xl text-xs font-bold transition-all',
                    inMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-neutral-700',
                    !disabled && !isSel && 'hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400',
                    isSel && 'bg-orange-500 text-white shadow-lg shadow-orange-500/30',
                    disabled && 'opacity-30 cursor-not-allowed',
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
