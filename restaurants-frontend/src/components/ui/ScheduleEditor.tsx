'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Copy, Check, CalendarClock, X } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { TimePicker } from '@/components/ui/TimePicker';
import { DAY_LABELS, formatTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import type { DayOfWeek, ScheduleInput } from '@/types/restaurant';

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const toHHmm = (t?: string | null) => (t ? t.slice(0, 5) : '');

/** Switch animado Abierto/Cerrado. */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-300 active:scale-95',
        checked ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300',
          checked && 'translate-x-5'
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

  // Inválido: día abierto cuya hora de apertura no es anterior a la de cierre.
  const isInvalid = (r: ScheduleInput) =>
    !r.isClosed && !!r.openingTime && !!r.closingTime && r.openingTime >= r.closingTime;
  const hasInvalid = rows.some(isInvalid);

  const update = (i: number, patch: Partial<ScheduleInput>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  // Abre/cierra el panel de "copiar a días específicos" para una fila.
  const toggleCopyPanel = (i: number) => {
    if (copyFor === i) { setCopyFor(null); return; }
    setCopyFor(i);
    setCopyTargets([]);
  };

  const toggleTarget = (day: DayOfWeek) =>
    setCopyTargets((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  // Aplica el horario de la fila origen a los días seleccionados (los deja abiertos).
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="font-display text-base font-semibold text-gray-900 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-orange-500" /> Horario de atención
        </h2>
        <span className="text-xs font-medium text-gray-400">{openCount}/7 días abiertos</span>
      </div>
      <p className="text-sm text-gray-500 mb-4">Activa los días que abres y define el rango horario. Usa el ícono de copiar para replicar un horario a toda la semana.</p>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
      ) : (
        <>
          <div className="space-y-2">
            {rows.map((row, i) => {
              const open = !row.isClosed;
              return (
                <div key={row.dayOfWeek}>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 transition-all duration-200',
                      isInvalid(row)
                        ? 'border-red-300 bg-red-50'
                        : open ? 'border-orange-100 bg-orange-50' : 'border-gray-100 bg-gray-50 opacity-70',
                      copyFor === i && 'rounded-b-none'
                    )}
                  >
                    {/* Día + toggle */}
                    <div className="flex items-center gap-3 w-40 flex-shrink-0">
                      <Toggle checked={open} onChange={(v) => update(i, { isClosed: !v })} />
                      <div className="leading-tight">
                        <p className="text-sm font-medium text-gray-800">{DAY_LABELS[row.dayOfWeek]}</p>
                        <p className={cn('text-[11px] font-medium', open ? 'text-orange-600' : 'text-gray-400')}>
                          {open ? 'Abierto' : 'Cerrado'}
                        </p>
                      </div>
                    </div>

                    {/* Horas o estado cerrado */}
                    {open ? (
                      <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
                        <TimePicker value={row.openingTime} onChange={(v) => update(i, { openingTime: v })} />
                        <span className="text-gray-400 text-sm">–</span>
                        <TimePicker value={row.closingTime} onChange={(v) => update(i, { closingTime: v })} />
                        <button
                          type="button"
                          onClick={() => toggleCopyPanel(i)}
                          title="Copiar este horario a otros días"
                          className={cn(
                            'p-1.5 rounded-lg transition-colors active:scale-90',
                            copyFor === i ? 'text-orange-600 bg-orange-100' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-100'
                          )}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="ml-auto text-sm text-gray-400">Sin atención</span>
                    )}
                  </div>

                  {open && isInvalid(row) && (
                    <p className="px-3 pt-1 text-xs text-red-500 font-medium">La hora de cierre debe ser posterior a la de apertura.</p>
                  )}

                  {/* Panel: copiar a días específicos */}
                  {copyFor === i && (
                    <div className="rounded-b-xl border border-t-0 border-orange-200 bg-orange-50/60 dark:bg-gray-800 p-3 animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-600">
                          Copiar <strong className="text-orange-600">{formatTime(row.openingTime || '00:00')}–{formatTime(row.closingTime || '00:00')}</strong> a:
                        </p>
                        <button onClick={() => setCopyFor(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {DAYS.filter((d) => d !== row.dayOfWeek).map((d) => {
                          const sel = copyTargets.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleTarget(d)}
                              className={cn(
                                'px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-95',
                                sel ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
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
                          className="text-xs font-medium text-gray-500 hover:text-orange-600"
                        >
                          Seleccionar todos
                        </button>
                        <button
                          type="button"
                          onClick={() => applyCopy(i)}
                          disabled={copyTargets.length === 0}
                          className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all active:scale-95"
                        >
                          <Check className="h-3.5 w-3.5" /> Aplicar a {copyTargets.length || ''} día{copyTargets.length === 1 ? '' : 's'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending || !dirty || hasInvalid}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-95"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Guardar horarios
            </button>
            {hasInvalid ? (
              <span className="text-xs text-red-500 font-medium">Corrige los horarios marcados en rojo.</span>
            ) : dirty ? (
              <span className="text-xs text-orange-600 font-medium animate-fade-in">Tienes cambios sin guardar</span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
