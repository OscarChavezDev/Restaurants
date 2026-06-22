'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ClipboardCheck, Loader2, Check, X, MapPin, Phone, Mail, Building2, Users, FileText,
} from 'lucide-react';
import { adminRegistrationService, type RegistrationRequest } from '@/services/adminRegistrationService';

export default function RegistrationRequestsPage() {
  const qc = useQueryClient();
  const { data: requests, isLoading } = useQuery({
    queryKey: ['registration-requests'],
    queryFn: () => adminRegistrationService.listPending(),
  });

  const approve = useMutation({
    mutationFn: (userId: string) => adminRegistrationService.approve(userId),
    onSuccess: () => {
      toast.success('Solicitud aprobada. La cuenta fue activada y el restaurante publicado.');
      qc.invalidateQueries({ queryKey: ['registration-requests'] });
    },
    onError: () => toast.error('No se pudo aprobar la solicitud'),
  });

  const reject = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminRegistrationService.reject(userId, reason),
    onSuccess: () => {
      toast.success('Solicitud rechazada. Se notificó al solicitante por correo.');
      qc.invalidateQueries({ queryKey: ['registration-requests'] });
    },
    onError: () => toast.error('No se pudo rechazar la solicitud'),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-orange-500" /> Solicitudes de registro
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Revisa los datos de cada restaurante y aprueba o rechaza la solicitud de cuenta.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
      ) : !requests || requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
          <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay solicitudes pendientes por revisar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard
              key={req.userId}
              req={req}
              busy={approve.isPending || reject.isPending}
              onApprove={() => approve.mutate(req.userId)}
              onReject={(reason) => reject.mutate({ userId: req.userId, reason })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  req, busy, onApprove, onReject,
}: {
  req: RegistrationRequest;
  busy: boolean;
  onApprove: () => void;
  onReject: (reason?: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      {/* Solicitante */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-900 dark:text-gray-50">{req.fullName}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {req.email}</span>
            {req.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {req.phone}</span>}
            <span>Solicitado: {new Date(req.requestedAt).toLocaleDateString('es-PE')}</span>
          </div>
        </div>
        <span className="flex-shrink-0 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 text-[11px] font-semibold">
          En revisión
        </span>
      </div>

      {/* Restaurantes */}
      <div className="mt-4 space-y-3">
        {req.restaurants.map((r) => (
          <div key={r.id} className="rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 p-4">
            <p className="font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" /> {r.name}
            </p>
            {r.description && (
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" /> {r.description}
              </p>
            )}
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" />
                {[r.address, r.district, r.city, r.region].filter(Boolean).join(', ')}
              </span>
              {r.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /> {r.phone}</span>}
              {typeof r.totalCapacity === 'number' && (
                <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gray-400" /> Capacidad: {r.totalCapacity}</span>
              )}
              {r.ruc && <span className="text-gray-500 dark:text-gray-400">RUC: {r.ruc}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      {!rejecting ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setRejecting(true)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            <X className="h-4 w-4" /> Rechazar
          </button>
          <button
            onClick={onApprove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-selva-500 hover:bg-selva-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            <Check className="h-4 w-4" /> Aprobar y publicar
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-3">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
            Motivo del rechazo (opcional, se incluye en el correo)
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Los datos del restaurante no son verificables."
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => { setRejecting(false); setReason(''); }}
              disabled={busy}
              className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={() => onReject(reason.trim() || undefined)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              <X className="h-4 w-4" /> Confirmar rechazo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
