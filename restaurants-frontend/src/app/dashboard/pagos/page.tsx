'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Wallet, Loader2, CheckCircle, XCircle, Clock, Image as ImageIcon, X, Calendar, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import { paymentService, type Payment } from '@/services/paymentService';
import { cn } from '@/utils/cn';

export default function PagosPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const qc = useQueryClient();
  const { data: mine } = useMyRestaurants();
  const { data: all } = useRestaurants(0, 100);
  const restaurants = (isAdmin ? all?.content : mine?.content) ?? [];

  const [restaurantId, setRestaurantId] = useState('');
  useEffect(() => {
    if (!restaurantId && restaurants.length) setRestaurantId(restaurants[0].id);
  }, [restaurants, restaurantId]);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', restaurantId],
    queryFn: () => paymentService.byRestaurant(restaurantId),
    enabled: !!restaurantId,
  });

  const verifyPay = useMutation({
    mutationFn: (id: string) => paymentService.verify(id),
    onSuccess: () => { toast.success('Pago verificado'); qc.invalidateQueries({ queryKey: ['payments', restaurantId] }); },
    onError: () => toast.error('No se pudo verificar el pago'),
  });
  const rejectPay = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => paymentService.reject(id, reason),
    onSuccess: () => {
      toast.success('Pago rechazado. Se notificó al cliente.');
      setRejectModal(null);
      qc.invalidateQueries({ queryKey: ['payments', restaurantId] });
    },
    onError: () => toast.error('No se pudo rechazar el pago'),
  });

  const busy = verifyPay.isPending || rejectPay.isPending;
  const pending = (payments ?? []).filter((p) => p.status !== 'VERIFIED' && p.status !== 'REJECTED');
  const history = (payments ?? []).filter((p) => p.status === 'VERIFIED' || p.status === 'REJECTED');

  // Modal para ver comprobante inline
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  // Modal para motivo de rechazo
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* HEADER FIJO */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 pb-4 mb-8 pt-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
          <div className="p-2.5 bg-orange-500/10 rounded-2xl">
            <Wallet className="h-7 w-7 text-orange-500" />
          </div>
          Pagos de adelanto
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Revisa los comprobantes de tus clientes y verifica o rechaza cada pago.
        </p>
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-neutral-800">
          <Wallet className="h-16 w-16 mx-auto mb-6 text-gray-300 dark:text-neutral-700" />
          <p className="text-lg font-bold text-gray-400 dark:text-neutral-500">Aún no tienes restaurantes.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {restaurants.length > 1 && (
            <RestaurantPicker restaurants={restaurants} value={restaurantId} onChange={(id) => { if (id) setRestaurantId(id); }} label="Restaurante a revisar" />
          )}

          {/* Por verificar */}
          <section className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm p-6 sm:p-8">
            <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-amber-500" /> Por verificar
              {pending.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 text-xs font-bold">{pending.length}</span>
              )}
            </h2>
            {isLoading ? (
              <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 dark:bg-neutral-800 animate-pulse rounded-2xl" />)}</div>
            ) : pending.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-400 opacity-60" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No hay comprobantes por revisar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((p) => (
                  <PaymentRow key={p.id} p={p} busy={busy} onVerify={() => verifyPay.mutate(p.id)} onReject={() => setRejectModal({ id: p.id, reason: '' })} onViewProof={setProofModalUrl} />
                ))}
              </div>
            )}
          </section>

          {/* Historial */}
          {history.length > 0 && (
            <section className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-6">Historial</h2>
              <div className="space-y-3">
                {history.map((p) => (
                  <PaymentRow key={p.id} p={p} busy={busy} onViewProof={setProofModalUrl} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal lightbox para ver comprobante */}
      {proofModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setProofModalUrl(null)}>
          <div className="relative max-w-2xl w-full max-h-[85vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
              <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-orange-500" /> Comprobante de pago
              </h3>
              <button onClick={() => setProofModalUrl(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proofModalUrl} alt="Comprobante de pago" className="max-w-full max-h-[70vh] rounded-xl object-contain" />
            </div>
          </div>
        </div>
      )}
      {/* Modal para motivo de rechazo */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setRejectModal(null)}>
          <div className="relative max-w-md w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-500" /> Rechazar pago
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Indica el motivo por el cual rechazas este comprobante. El cliente recibirá un correo con esta información y podrá volver a intentarlo.
            </p>
            <textarea
              autoFocus
              className="w-full rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
              rows={3}
              placeholder="Ej: El monto depositado no coincide / La imagen está borrosa / El depósito no figura en la cuenta..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
            />
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => rejectPay.mutate({ id: rejectModal.id, reason: rejectModal.reason })}
                disabled={!rejectModal.reason.trim() || rejectPay.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {rejectPay.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: typeof CheckCircle }> = {
  VERIFIED: { label: 'Verificado', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', icon: CheckCircle },
  REJECTED: { label: 'Rechazado', cls: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400', icon: XCircle },
};

function PaymentRow({ p, busy, onVerify, onReject, onViewProof }: { p: Payment; busy: boolean; onVerify?: () => void; onReject?: () => void; onViewProof: (url: string) => void }) {
  const badge = STATUS_BADGE[p.status];
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/30 hover:border-gray-200 dark:hover:border-neutral-700 transition-colors">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold shrink-0">
        {(p.customerName ?? '?').charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{p.customerName ?? 'Cliente'}</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-neutral-900 px-2 py-0.5 rounded-full border border-gray-100 dark:border-neutral-700">
            <CreditCard className="h-3 w-3" /> {p.method}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {p.confirmationCode && (
            <code className="font-mono font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-neutral-900 px-2 py-0.5 rounded-md border border-gray-100 dark:border-neutral-700">
              #{p.confirmationCode}
            </code>
          )}
          {p.reservationDate && (
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Reserva: {new Date(p.reservationDate).toLocaleDateString('es-PE')}</span>
          )}
          {p.proofImageUrl && (
            <button onClick={() => onViewProof(p.proofImageUrl!)} className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:underline font-semibold">
              <ImageIcon className="h-3 w-3" /> Ver comprobante
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 sm:flex-col sm:items-end sm:gap-2">
        <span className="text-lg font-display font-black text-gray-900 dark:text-white">S/ {p.amount.toFixed(2)}</span>

        {badge ? (
          <span className={cn('inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full', badge.cls)}>
            <badge.icon className="h-3.5 w-3.5" /> {badge.label}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={onVerify} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 active:scale-95">
              <CheckCircle className="h-4 w-4" /> Verificar
            </button>
            <button onClick={onReject} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-bold rounded-xl transition-colors disabled:opacity-60 active:scale-95">
              <XCircle className="h-4 w-4" /> Rechazar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
