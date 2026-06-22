'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Wallet, Loader2, CheckCircle, XCircle, ExternalLink, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import { paymentService, type Payment } from '@/services/paymentService';

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
    mutationFn: (id: string) => paymentService.reject(id),
    onSuccess: () => { toast.success('Pago rechazado. La reserva vuelve a quedar pendiente de pago.'); qc.invalidateQueries({ queryKey: ['payments', restaurantId] }); },
    onError: () => toast.error('No se pudo rechazar el pago'),
  });

  const busy = verifyPay.isPending || rejectPay.isPending;
  const pending = (payments ?? []).filter((p) => p.status !== 'VERIFIED' && p.status !== 'REJECTED');
  const history = (payments ?? []).filter((p) => p.status === 'VERIFIED' || p.status === 'REJECTED');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <Wallet className="h-6 w-6 text-orange-500" /> Pagos de adelanto
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Revisa los comprobantes de tus clientes y verifica o rechaza cada pago.
        </p>
      </div>

      {restaurants.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Aún no tienes restaurantes.</p>
      ) : (
        <>
          {restaurants.length > 0 && (
            <RestaurantPicker restaurants={restaurants} value={restaurantId} onChange={(id) => { if (id) setRestaurantId(id); }} />
          )}

          {/* Por verificar */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-amber-500" /> Por verificar
              {pending.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 text-xs font-bold">{pending.length}</span>
              )}
            </h2>
            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
            ) : pending.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay comprobantes por revisar.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {pending.map((p) => (
                  <PaymentRow key={p.id} p={p} busy={busy} onVerify={() => verifyPay.mutate(p.id)} onReject={() => rejectPay.mutate(p.id)} />
                ))}
              </div>
            )}
          </section>

          {/* Historial */}
          {history.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">Historial</h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map((p) => (
                  <PaymentRow key={p.id} p={p} busy={busy} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PaymentRow({ p, busy, onVerify, onReject }: { p: Payment; busy: boolean; onVerify?: () => void; onReject?: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
          {p.customerName ?? '—'} · S/ {p.amount.toFixed(2)} · {p.method}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {p.confirmationCode}
          {p.proofImageUrl && (
            <> · <a href={p.proofImageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-orange-600 hover:underline">ver comprobante <ExternalLink className="h-3 w-3" /></a></>
          )}
        </p>
      </div>
      {p.status === 'VERIFIED' ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-selva-600 dark:text-selva-400 flex-shrink-0">
          <CheckCircle className="h-4 w-4" /> Verificado
        </span>
      ) : p.status === 'REJECTED' ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 flex-shrink-0">
          <XCircle className="h-4 w-4" /> Rechazado
        </span>
      ) : (
        <div className="flex flex-shrink-0 items-center gap-2">
          <button onClick={onVerify} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-selva-500 hover:bg-selva-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
            <CheckCircle className="h-4 w-4" /> Verificar
          </button>
          <button onClick={onReject} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
            <XCircle className="h-4 w-4" /> Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
