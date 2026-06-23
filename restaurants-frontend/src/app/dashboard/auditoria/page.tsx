'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAuditLogs } from '@/hooks/useAdmin';

const ENTITY_TYPES = ['RESERVATION', 'PAYMENT', 'RESTAURANT', 'USER'];
const ACTION_LABELS: Record<string, string> = {
  CANCEL_RESERVATION: 'Canceló reserva',
  MARK_ARRIVED: 'Marcó llegada',
  MARK_NO_SHOW: 'Marcó no-show',
  VERIFY_PAYMENT: 'Verificó pago',
  REJECT_PAYMENT: 'Rechazó pago',
  UPDATE_RESTAURANT_STATUS: 'Cambió estado de restaurante',
  UPDATE_USER_ROLE: 'Cambió rol de usuario',
  TOGGLE_USER_ACTIVE: 'Activó/desactivó usuario',
  DELETE_USER: 'Eliminó usuario',
};

export default function AuditoriaPage() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(0);
  const size = 15;

  useEffect(() => {
    if (!isAdmin) router.replace('/dashboard');
  }, [isAdmin, router]);

  const { data, isLoading } = useAuditLogs({ entityType: entityType || undefined, page, size });

  if (!isAdmin) return null;

  const logs = data?.content ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-orange-500" /> Logs de Auditoría
        </h1>
        <p className="text-gray-600 mt-1">Registro de acciones críticas del sistema</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(0); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
        >
          <option value="">Todas las entidades</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No hay registros de auditoría todavía.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Entidad</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Realizado por</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.performedAt).toLocaleString('es-PE')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{log.entityType}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="px-4 py-3 text-gray-700">{log.performedByName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={log.detail}>{log.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </button>
          <span className="text-xs text-gray-500">Página {page + 1} de {data.totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= data.totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 disabled:opacity-40"
          >
            Siguiente <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
