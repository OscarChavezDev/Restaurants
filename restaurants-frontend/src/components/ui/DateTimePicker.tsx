'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, parseISO, setHours, setMinutes, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/utils/cn';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface DateTimePickerProps {
  /** Formato 'yyyy-MM-ddTHH:mm', igual que <input type="datetime-local"> */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  /** Fecha mínima seleccionable (se deshabilitan los días anteriores) */
  minDate?: Date;
}

export function DateTimePicker({ value, onChange, placeholder = 'Selecciona fecha y hora', error, minDate }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState(() => selected ?? minDate ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const commit = (next: Date) => onChange(format(next, "yyyy-MM-dd'T'HH:mm"));

  const pickDay = (day: Date) => {
    const base = selected ?? new Date();
    commit(setMinutes(setHours(day, base.getHours()), base.getMinutes()));
  };

  const setTime = (raw: string) => {
    const [h, m] = raw.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    commit(setMinutes(setHours(selected ?? new Date(), h), m));
  };

  const isDisabled = (day: Date) => !!minDate && day < minDate && !isSameDay(day, minDate);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white px-5 py-3.5 text-sm font-medium outline-none transition-all hover:bg-gray-100 dark:hover:bg-neutral-700/50',
          open && 'border-orange-500/50 bg-white dark:bg-neutral-900 ring-4 ring-orange-500/10',
          error && 'border-red-400 bg-red-50 dark:bg-red-500/10',
        )}
      >
        <span className={cn(!selected && 'text-gray-400 dark:text-gray-500 font-normal')}>
          {selected ? format(selected, "d 'de' MMMM',' HH:mm'h'", { locale: es }) : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[300px] bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-gray-100 dark:border-neutral-800 shadow-2xl shadow-black/10 dark:shadow-black/40 p-4 animate-in fade-in zoom-in-95 duration-150">
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

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800 flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-neutral-800 rounded-xl text-gray-400 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <input
              type="time"
              value={selected ? format(selected, 'HH:mm') : ''}
              onChange={(e) => setTime(e.target.value)}
              className="flex-1 rounded-xl border-2 border-transparent bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm font-bold outline-none focus:border-orange-500/50 focus:bg-white dark:focus:bg-neutral-900 focus:ring-4 focus:ring-orange-500/10 transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
}
