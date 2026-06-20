'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Plus, Trash2, Loader2, Armchair, Users } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { SelectMenu } from '@/components/ui/SelectMenu';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function TablesManager({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const { data: sections } = useQuery({
    queryKey: ['sections', restaurantId],
    queryFn: () => restaurantService.getSections(restaurantId),
    enabled: !!restaurantId,
  });
  const { data: tables } = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: () => restaurantService.getTables(restaurantId),
    enabled: !!restaurantId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['sections', restaurantId] });
    qc.invalidateQueries({ queryKey: ['tables', restaurantId] });
  };

  // ── Forms ──
  const [secName, setSecName] = useState('');

  const [tblNumber, setTblNumber] = useState('');
  const [tblCap, setTblCap] = useState(4);
  const [tblSection, setTblSection] = useState('');

  const addSection = useMutation({
    mutationFn: () => restaurantService.addSection(restaurantId, { name: secName.trim(), type: 'INTERIOR', capacity: 0 }),
    onSuccess: () => { invalidate(); setSecName(''); toast.success('Sección agregada'); },
    onError: () => toast.error('No se pudo agregar la sección'),
  });
  const delSection = useMutation({
    mutationFn: (id: string) => restaurantService.deleteSection(restaurantId, id),
    onSuccess: () => { invalidate(); toast.success('Sección eliminada'); },
    onError: () => toast.error('No se pudo eliminar'),
  });
  const addTable = useMutation({
    mutationFn: () => restaurantService.addTable(restaurantId, { tableNumber: tblNumber.trim(), capacity: tblCap, sectionId: tblSection || undefined }),
    onSuccess: () => { invalidate(); setTblNumber(''); setTblCap(4); toast.success('Mesa agregada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'No se pudo agregar la mesa'),
  });
  const delTable = useMutation({
    mutationFn: (id: string) => restaurantService.deleteTable(restaurantId, id),
    onSuccess: () => { invalidate(); toast.success('Mesa eliminada'); },
    onError: () => toast.error('No se pudo eliminar'),
  });

  const totalTables = tables?.length ?? 0;
  const totalSeats = (tables ?? []).reduce((s, t) => s + t.capacity, 0);

  const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="font-display text-base font-semibold text-gray-900 flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-orange-500" /> Mesas y secciones
        </h2>
        <span className="text-xs font-medium text-gray-400">{totalTables} mesas · {totalSeats} asientos</span>
      </div>
      <p className="text-sm text-gray-500 mb-5">Define las secciones del local y registra tus mesas. Es la base para la reserva por mesa.</p>

      {/* ── Secciones ── */}
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Secciones</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {(sections ?? []).length === 0 && <p className="text-sm text-gray-400">Aún no hay secciones.</p>}
        {(sections ?? []).map((s) => (
          <span key={s.id} className="group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-sm animate-pop-in">
            <span className="font-medium text-orange-700">{s.name}</span>
            <button onClick={() => delSection.mutate(s.id)} className="p-0.5 rounded-full text-orange-400 hover:text-red-500 hover:bg-white transition-colors active:scale-90">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2 mb-6">
        <input
          value={secName}
          onChange={(e) => setSecName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && secName.trim()) addSection.mutate(); }}
          placeholder="Nombre de la sección (ej. Terraza, Salón principal)"
          className={cn(inputCls, 'flex-1 min-w-[200px]')}
        />
        <button
          onClick={() => secName.trim() && addSection.mutate()}
          disabled={addSection.isPending || !secName.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all active:scale-95"
        >
          {addSection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Sección
        </button>
      </div>

      {/* ── Mesas ── */}
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Mesas</h3>
      <div className="space-y-2 mb-3">
        {totalTables === 0 && <p className="text-sm text-gray-400">Aún no hay mesas.</p>}
        {(tables ?? []).map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 animate-pop-in">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
              <Armchair className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">{t.tableNumber}</p>
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{t.capacity}</span>
                {t.sectionName && <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-500">{t.sectionName}</span>}
              </p>
            </div>
            <button onClick={() => delTable.mutate(t.id)} className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-90">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <input value={tblNumber} onChange={(e) => setTblNumber(e.target.value)} placeholder="N° / nombre (ej. M1)" className={cn(inputCls, 'w-32')} />
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-gray-400" />
          <input type="number" min={1} value={tblCap} onChange={(e) => setTblCap(Number(e.target.value))} className={cn(inputCls, 'w-20')} />
        </div>
        <SelectMenu
          value={tblSection}
          onChange={setTblSection}
          placeholder="Sin sección"
          options={[{ value: '', label: 'Sin sección' }, ...(sections ?? []).map((s) => ({ value: s.id, label: s.name }))]}
        />
        <button
          onClick={() => tblNumber.trim() && addTable.mutate()}
          disabled={addTable.isPending || !tblNumber.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all active:scale-95"
        >
          {addTable.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Mesa
        </button>
      </div>
    </div>
  );
}
