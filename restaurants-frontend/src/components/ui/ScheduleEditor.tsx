'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Copy, Check, CalendarClock, X, Save, AlertCircle } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { TimePicker } from '@/components/ui/TimePicker';
import { DAY_LABELS, formatTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import type { DayOfWeek, ScheduleInput } from '@/types/restaurant';

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const toHHmm = (t?: string | null) => (t ? t.slice(0, 5) : '');

/** Switch animado compacto. */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-300 active:scale-95',
        checked ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300',
          checked && 'translate-x-4'
        )}
      />
    </button>
  );
}

export function ScheduleEditor({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['schedules', restaurantId],
    queryFn: () => restaurantService.getSchedules(restaurantId),
    enabled: !!restaurantId,
  });

  const [rows, setRows] = useState<ScheduleInput[]>([]);
  const [copyFor, setCopyFor] = useState<number | null>(null);
  const [copyTargets, setCopyTargets] = useState<DayOfWeek[]>([]);

  const initialRows = useMemo<ScheduleInput[]>(() => {
    const byDay = new Map((data ?? []).map((s) => [s.dayOfWeek, s]));
    return DAYS.map((day) => {
      const s = byDay.get(day);
      return {
        dayOfWeek: day,
        openingTime: s ? toHHmm(s.openingTime) : '09:00',
        closingTime: s ? toHHmm(s.closingTime) : '22:00',
        isClosed: s ? s.isClosed : false,
      };
    });
  }, [data]);

  useEffect(() => { setRows(initialRows); }, [initialRows]);

  const dirty = useMemo(() => JSON.stringify(rows) !== JSON.stringify(initialRows), [rows, initialRows]);
  const openCount = rows.filter((r) => !r.isClosed).length;

  const isInvalid = (r: ScheduleInput) =>
    !r.isClosed && !!r.openingTime && !!r.closingTime && r.openingTime >= r.closingTime;
  const hasInvalid = rows.some(isInvalid);

  const update = (i: number, patch: Partial<ScheduleInput>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const toggleCopyPanel = (i: number) => {
    if (copyFor === i) { setCopyFor(null); return; }
    setCopyFor(i);
    setCopyTargets([]);
  };

  const toggleTarget = (day: DayOfWeek) =>
    setCopyTargets((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const applyCopy = (srcIndex: number) => {
    const src = rows[srcIndex];
    if (copyTargets.length === 0) return;
    setRows((prev) =>
      prev.map((r) =>
        copyTargets.includes(r.dayOfWeek)
          ? { ...r, openingTime: src.openingTime, closingTime: src.closingTime, isClosed: false }
          : r
      )
    );
    toast.success(`Horario copiado a ${copyTargets.length} día(s)`);
    setCopyFor(null);
    setCopyTargets([]);
  };

  const save = useMutation({
    mutationFn: () =>
      restaurantService.updateSchedules(
        restaurantId,
        rows.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          openingTime: r.isClosed ? null : r.openingTime || null,
          closingTime: r.isClosed ? null : r.closingTime || null,
          isClosed: r.isClosed,
        }))
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules', restaurantId] });
      qc.invalidateQueries({ queryKey: ['restaurants', 'detail', restaurantId] });
      toast.success('Horarios guardados');
    },
    onError: () => toast.error('No se pudieron guardar los horarios'),
  });

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm p-6 h-full transition-colors hover:border-gray-200 dark:hover:border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
            <CalendarClock className="h-5 w-5" />
          </span>
          Horario de atención
        </h2>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{openCount}/7 días abiertos</span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Activa los días que abres y define el rango horario.</p>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 skeleton rounded-lg" />)}</div>
      ) : (
        <>
          {/* Table-like layout */}
          <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            {rows.map((row, i) => {
              const open = !row.isClosed;
              return (
                <div key={row.dayOfWeek}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-colors',
                      i > 0 && 'border-t border-gray-100 dark:border-neutral-800',
                      isInvalid(row) && 'bg-red-50/50 dark:!bg-red-900/5',
                      !open && 'opacity-50'
                    )}
                  >
                    {/* Toggle */}
                    <Toggle checked={open} onChange={(v) => update(i, { isClosed: !v })} />
                    
                    {/* Day name */}
                    <div className="w-24 flex-shrink-0">
                      <p className={cn('text-sm font-semibold', open ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400')}>
                        {DAY_LABELS[row.dayOfWeek]}
                      </p>
                    </div>

                    {/* Time pickers or closed label */}
                    <div className="flex items-center gap-2 ml-auto">
                      {open ? (
                        <>
                          <TimePicker value={row.openingTime} onChange={(v) => update(i, { openingTime: v })} />
                          <span className="text-gray-300 dark:text-gray-600 text-xs">→</span>
                          <TimePicker value={row.closingTime} onChange={(v) => update(i, { closingTime: v })} />
                          <button
                            type="button"
                            onClick={() => toggleCopyPanel(i)}
                            title="Copiar horario"
                            className={cn(
                              'p-1.5 rounded-lg transition-all active:scale-95 ml-1',
                              copyFor === i
                                ? 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:!bg-orange-500/20'
                                : 'text-gray-300 dark:text-gray-600 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:!bg-white/5'
                            )}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Cerrado</span>
                      )}
                    </div>
                  </div>

                  {open && isInvalid(row) && (
                    <p className="px-4 pb-2 text-xs text-red-500 font-medium -mt-1">La hora de cierre debe ser posterior a la de apertura.</p>
                  )}

                  {/* Copy panel */}
                  {copyFor === i && (
                    <div className="border-t border-orange-200 dark:border-orange-500/20 bg-orange-50/40 dark:!bg-orange-900/5 px-4 py-3 animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          Copiar <strong className="text-orange-600 dark:text-orange-400">{formatTime(row.openingTime || '00:00')}–{formatTime(row.closingTime || '00:00')}</strong> a:
                        </p>
                        <button onClick={() => setCopyFor(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {DAYS.filter((d) => d !== row.dayOfWeek).map((d) => {
                          const sel = copyTargets.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleTarget(d)}
                              className={cn(
                                'px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-95',
                                sel ? 'bg-orange-500 text-white border-orange-500' : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-500/50'
                              )}
                            >
                              {DAY_LABELS[d]}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCopyTargets(DAYS.filter((d) => d !== row.dayOfWeek))}
                          className="text-xs font-medium text-gray-500 hover:text-orange-600 dark:hover:text-orange-400"
                        >
                          Seleccionar todos
                        </button>
                        <button
                          type="button"
                          onClick={() => applyCopy(i)}
                          disabled={copyTargets.length === 0}
                          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all active:scale-95"
                        >
                          <Check className="h-3.5 w-3.5" /> Aplicar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save button */}
          <div className="mt-8 flex items-center justify-between gap-4 p-2 pl-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/30">
            <div>
              {hasInvalid ? (
                <span className="text-sm text-red-500 font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Corrige los horarios en rojo
                </span>
              ) : dirty ? (
                <span className="text-sm text-amber-500 font-bold flex items-center gap-2 animate-pulse">
                  <AlertCircle className="h-4 w-4" /> Cambios sin guardar
                </span>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Horarios actualizados
                </span>
              )}
            </div>
            
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending || !dirty || hasInvalid}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:dark:bg-neutral-800 disabled:dark:text-neutral-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:active:scale-100 disabled:shadow-none"
            >
              {save.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Guardar Cambios
            </button>
          </div>
        </>
      )}
    </div>
  );
}
