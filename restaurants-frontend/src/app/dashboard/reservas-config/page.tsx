'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRef } from 'react';
import { Loader2, Save, SlidersHorizontal, Hourglass, Trash2, QrCode, Upload, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import { reservationConfigService, type ReservationConfig } from '@/services/reservationConfigService';
import { waitlistService } from '@/services/waitlistService';
import { uploadToCloudinary, validateImage } from '@/utils/uploadToCloudinary';
import { formatTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const inputCls =
  'w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';
const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5';

export default function ReservationConfigPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const qc = useQueryClient();
  const { data: mine } = useMyRestaurants();
  const { data: all } = useRestaurants(0, 100);
  const restaurants = (isAdmin ? all?.content : mine?.content) ?? [];

  const [restaurantId, setRestaurantId] = useState<string>('');
  useEffect(() => {
    if (!restaurantId && restaurants.length) setRestaurantId(restaurants[0].id);
  }, [restaurants, restaurantId]);

  const { data: config } = useQuery({
    queryKey: ['reservation-config', restaurantId],
    queryFn: () => reservationConfigService.get(restaurantId),
    enabled: !!restaurantId,
  });

  const [form, setForm] = useState<ReservationConfig | null>(null);
  useEffect(() => { if (config) setForm(config); }, [config]);

  const save = useMutation({
    mutationFn: () => reservationConfigService.update(restaurantId, form!),
    onSuccess: () => {
      toast.success('Reglas de reserva guardadas');
      qc.invalidateQueries({ queryKey: ['reservation-config', restaurantId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al guardar'),
  });

  // Lista de espera del restaurante (S11-05)
  const { data: waitlist } = useQuery({
    queryKey: ['waitlist', restaurantId],
    queryFn: () => waitlistService.byRestaurant(restaurantId),
    enabled: !!restaurantId,
  });
  const cancelWait = useMutation({
    mutationFn: (id: string) => waitlistService.cancel(id),
    onSuccess: () => { toast.success('Anotación quitada'); qc.invalidateQueries({ queryKey: ['waitlist', restaurantId] }); },
  });

  // El botón Guardar solo se activa si el formulario difiere de lo guardado.
  const dirty = !!form && !!config && JSON.stringify(form) !== JSON.stringify(config);

  const set = <K extends keyof ReservationConfig>(k: K, v: ReservationConfig[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  // Subida del QR de pago
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const handleQrUpload = async (file: File) => {
    const err = validateImage(file);
    if (err) { toast.error(err); return; }
    try {
      setUploadingQr(true);
      const { url } = await uploadToCloudinary(file, 'payment-qr');
      set('paymentQrUrl', url);
      toast.success('QR cargado. No olvides guardar.');
    } catch (e: any) {
      toast.error(e?.message ?? 'No se pudo subir el QR');
    } finally {
      setUploadingQr(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <SlidersHorizontal className="h-6 w-6 text-orange-500" /> Reglas de reserva
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Define cómo funcionan las reservas de tu restaurante.</p>
      </div>

      {/* Selector de restaurante (mismo formato que las demás secciones) */}
      {restaurants.length > 0 && (
        <RestaurantPicker
          restaurants={restaurants}
          value={restaurantId}
          onChange={(id) => { if (id) setRestaurantId(id); }}
        />
      )}

      {restaurants.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Aún no tienes restaurantes.</p>
      ) : !form ? (
        <div className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
            {/* Anticipación y cancelación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Anticipación mínima (horas)</label>
                <input type="number" min={0} value={form.minAdvanceHours} onChange={(e) => set('minAdvanceHours', +e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Límite de cancelación (horas antes)</label>
                <input type="number" min={0} value={form.cancellationDeadlineHours} onChange={(e) => set('cancellationDeadlineHours', +e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Personas por mesa</label>
                <input type="number" min={1} value={form.personsPerTable} onChange={(e) => set('personsPerTable', +e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hasta cuántas personas es grupo pequeño</label>
                <input type="number" min={1} value={form.smallGroupMaxPersons} onChange={(e) => set('smallGroupMaxPersons', +e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Toggles */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allowSectionSelection} onChange={(e) => set('allowSectionSelection', e.target.checked)} className="h-4 w-4 accent-orange-500" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Permitir que el cliente elija la sección del local</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.requiresAdvancePayment} onChange={(e) => set('requiresAdvancePayment', e.target.checked)} className="h-4 w-4 accent-orange-500" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Exigir adelanto de pago</span>
            </label>

            {/* Reglas de adelanto */}
            {form.requiresAdvancePayment && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Adelanto para grupo pequeño</label>
                    <select value={form.smallGroupAdvanceType} onChange={(e) => set('smallGroupAdvanceType', e.target.value as ReservationConfig['smallGroupAdvanceType'])} className={inputCls}>
                      <option value="CHEAPEST_DISH">Precio del plato más económico</option>
                      <option value="FIXED_AMOUNT">Monto fijo</option>
                    </select>
                  </div>
                  {form.smallGroupAdvanceType === 'FIXED_AMOUNT' && (
                    <div>
                      <label className={labelCls}>Monto fijo (S/)</label>
                      <input type="number" min={0} step="0.5" value={Number(form.smallGroupFixedAmount)} onChange={(e) => set('smallGroupFixedAmount', +e.target.value)} className={inputCls} />
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Grupo grande: % del pedido</label>
                    <input type="number" min={0} max={100} value={form.largeGroupAdvancePercent} onChange={(e) => set('largeGroupAdvancePercent', +e.target.value)} className={inputCls} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Sin pre-pedido del menú, el grupo grande se estima como % sobre (plato más barato × personas).
                </p>
              </div>
            )}

            {/* Instrucciones de pago */}
            {form.requiresAdvancePayment && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Instrucciones de pago (cuenta / Yape / Plin)</label>
                  <textarea rows={3} value={form.paymentInfo ?? ''} onChange={(e) => set('paymentInfo', e.target.value)} placeholder="Ej: Yape al 962 000 000 (a nombre de…) · Cuenta BCP 123-456789-0-12" className={cn(inputCls, 'resize-none')} />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Se incluyen en el correo de confirmación y en el asistente.</p>
                </div>
                {/* QR de pago */}
                <div>
                  <label className={labelCls}><QrCode className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />QR de pago (Yape/Plin)</label>
                  <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrUpload(f); e.target.value = ''; }} />
                  {form.paymentQrUrl ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.paymentQrUrl} alt="QR de pago" className="h-24 w-24 rounded-xl border border-gray-200 dark:border-gray-600 object-cover" />
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={() => qrInputRef.current?.click()} disabled={uploadingQr} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                          {uploadingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Cambiar
                        </button>
                        <button type="button" onClick={() => set('paymentQrUrl', undefined)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-red-500">
                          <X className="h-4 w-4" /> Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => qrInputRef.current?.click()} disabled={uploadingQr} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-300 hover:border-orange-400 hover:text-orange-600 transition-colors">
                      {uploadingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir imagen del QR
                    </button>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">El asistente mostrará este QR cuando el cliente pregunte cómo pagar.</p>
                </div>
              </div>
            )}

            {/* T&C */}
            <div>
              <label className={labelCls}>Términos y condiciones (el cliente debe aceptarlos)</label>
              <textarea rows={4} value={form.termsAndConditions ?? ''} onChange={(e) => set('termsAndConditions', e.target.value)} placeholder="Ej: La reserva se mantiene 15 minutos. El adelanto no es reembolsable…" className={cn(inputCls, 'resize-none')} />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => save.mutate()} disabled={save.isPending || !dirty} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-lg shadow-orange-500/25 transition-all">
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
              </button>
              {dirty && !save.isPending && (
                <span className="text-xs text-amber-600 dark:text-amber-400">Tienes cambios sin guardar</span>
              )}
            </div>
          </div>

          {/* Lista de espera */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2 mb-3">
              <Hourglass className="h-5 w-5 text-orange-500" /> Lista de espera
            </h2>
            {!waitlist || waitlist.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay clientes en lista de espera.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {waitlist.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{w.customerName} · {w.partySize} pers.</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {w.reservationDate}{w.startTime ? ` · ${formatTime(w.startTime)}` : ''}{w.customerPhone ? ` · ${w.customerPhone}` : ''}
                      </p>
                    </div>
                    <button onClick={() => cancelWait.mutate(w.id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors" title="Quitar de la lista">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </>
      )}
    </div>
  );
}
