'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Calendar, CheckCircle, XCircle, Clock, ArrowLeft, Star, Wallet, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useReservationByCode } from '@/hooks/useReservations';
import { useRatings } from '@/hooks/useRatings';
import { useAuthStore } from '@/store/authStore';
import { paymentService } from '@/services/paymentService';
import { reservationConfigService, type ReservationConfig } from '@/services/reservationConfigService';
import { uploadToCloudinary, validateImage } from '@/utils/uploadToCloudinary';
import toast from 'react-hot-toast';
import { formatDate, formatTime, STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';

import { Suspense } from 'react';

function StarRating({ value, onChange, size = "md" }: { value: number, onChange: (v: number) => void, size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className="focus:outline-none transition-transform hover:scale-110">
          <Star className={cn(iconSize, i <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200 hover:text-yellow-200")} />
        </button>
      ))}
    </div>
  );
}

function ReservationLookupContent() {
  const searchParams = useSearchParams();
  const defaultCode = searchParams.get('code') || '';
  
  const [code, setCode] = useState(defaultCode);
  const [search, setSearch] = useState(defaultCode);

  const { data: reservation, isLoading, error } = useReservationByCode(search);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Pago del adelanto (Sprint 12)
  const [proofMethod, setProofMethod] = useState('YAPE');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofDone, setProofDone] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Instrucciones de pago reales del restaurante (formas de pago + QR).
  const [payCfg, setPayCfg] = useState<ReservationConfig | null>(null);
  useEffect(() => {
    if (reservation?.restaurantId && !!reservation.advanceAmount && reservation.advanceAmount > 0) {
      reservationConfigService.get(reservation.restaurantId).then(setPayCfg).catch(() => setPayCfg(null));
    } else {
      setPayCfg(null);
    }
  }, [reservation?.restaurantId, reservation?.advanceAmount]);

  const handleProof = async (file: File) => {
    const err = validateImage(file);
    if (err) { toast.error(err); return; }
    if (!reservation) return;
    try {
      setUploadingProof(true);
      const { url } = await uploadToCloudinary(file, 'payment-proofs');
      await paymentService.submitProof({
        reservationId: reservation.id,
        amount: reservation.advanceAmount ?? 0,
        method: proofMethod,
        proofImageUrl: url,
      });
      toast.success('Comprobante enviado. El restaurante lo verificará.');
      setProofDone(true);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? e?.message ?? 'Error al subir el comprobante');
    } finally {
      setUploadingProof(false);
    }
  };

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewScore, setReviewScore] = useState(0);
  const [foodScore, setFoodScore] = useState(0);
  const [serviceScore, setServiceScore] = useState(0);
  const [ambianceScore, setAmbianceScore] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const { createRating, loading: submittingReview } = useRatings();

  useEffect(() => {
    if (defaultCode) {
      setCode(defaultCode);
      setSearch(defaultCode.toUpperCase().trim());
    }
  }, [defaultCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(code.toUpperCase().trim());
  };

  const StatusIcon = reservation?.status === 'CONFIRMED' ? CheckCircle
    : reservation?.status === 'CANCELLED' ? XCircle : Clock;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewScore || !reservation) {
        toast.error('Por favor, selecciona una puntuación general');
        return;
    }
    try {
      await createRating({
        reservationId: reservation.id,
        score: reviewScore,
        foodScore: foodScore || undefined,
        serviceScore: serviceScore || undefined,
        ambianceScore: ambianceScore || undefined,
        comment: comment || undefined,
      });
      toast.success('¡Reseña enviada con éxito!');
      setReviewSubmitted(true);
      setShowReviewForm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar reseña');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 dark:from-[#3E1408] dark:to-[#7C2D12] py-8">
        {/* glow cálido sutil */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 80% at 70% 0%, rgba(255,196,140,0.22) 0%, transparent 60%)' }} />
        <div className="relative mx-auto max-w-2xl px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium shadow-sm mb-5 bg-white text-orange-600 hover:bg-orange-50 border border-white/50 dark:bg-white/10 dark:text-white dark:border-white/20 dark:backdrop-blur-md dark:hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>

          <div className="text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md mb-3">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1.5">Consulta tu Reserva</h1>
            <p className="text-orange-100 text-sm mb-5">Ingresa el código de confirmación que recibiste</p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Ej: RES-AB12CD34"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 font-mono uppercase"
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-[#ffffff] text-[#C2410C] dark:bg-orange-500 dark:text-white font-semibold rounded-xl hover:bg-orange-50 dark:hover:bg-orange-600 hover:scale-105 transition-all duration-200 whitespace-nowrap shadow-sm">
                Buscar
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-3">Buscando reserva...</p>
          </div>
        )}

        {error && search && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-1">No encontrada</h3>
            <p className="text-gray-500">No existe una reserva con el código <code className="font-mono bg-gray-100 px-1 rounded">{search}</code></p>
          </div>
        )}

        {reservation && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={cn('p-4 flex items-center gap-3', {
              'bg-green-50': reservation.status === 'CONFIRMED',
              'bg-yellow-50': reservation.status === 'PENDING',
              'bg-red-50': reservation.status === 'CANCELLED',
              'bg-gray-50': reservation.status === 'COMPLETED' || reservation.status === 'NO_SHOW',
            })}>
              <StatusIcon className={cn('h-6 w-6', {
                'text-green-500': reservation.status === 'CONFIRMED',
                'text-yellow-500': reservation.status === 'PENDING',
                'text-red-500': reservation.status === 'CANCELLED',
                'text-gray-400': reservation.status === 'COMPLETED' || reservation.status === 'NO_SHOW',
              })} />
              <div>
                <p className="font-semibold text-gray-900">{STATUS_LABELS[reservation.status]}</p>
                <code className="text-xs text-gray-500 font-mono">{reservation.confirmationCode}</code>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Restaurante</p>
                  <p className="font-medium text-gray-900">{reservation.restaurantName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cliente</p>
                  <p className="font-medium text-gray-900">{reservation.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Fecha</p>
                  <p className="font-medium text-gray-900">{formatDate(reservation.reservationDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hora</p>
                  <p className="font-medium text-gray-900">{formatTime(reservation.startTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Personas</p>
                  <p className="font-medium text-gray-900">{reservation.partySize}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Teléfono</p>
                  <p className="font-medium text-gray-900">{reservation.customerPhone}</p>
                </div>
              </div>
              {/* Adelanto / pago (Sprint 12) */}
              {!!reservation.advanceAmount && reservation.advanceAmount > 0 && reservation.status !== 'CANCELLED' && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-orange-500" /> Adelanto
                  </h3>
                  {reservation.paymentStatus === 'PAYMENT_VERIFIED' ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-sm">
                      <CheckCircle className="h-4 w-4" /> Adelanto de S/ {reservation.advanceAmount.toFixed(2)} verificado. ¡Todo listo!
                    </div>
                  ) : reservation.paymentStatus === 'PROOF_SUBMITTED' || proofDone ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm">
                      <Clock className="h-4 w-4" /> Comprobante enviado. En revisión por el restaurante.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-orange-50 text-orange-800 text-sm space-y-2">
                        <p>Debes pagar un adelanto de <strong>S/ {reservation.advanceAmount.toFixed(2)}</strong> (concepto: {reservation.confirmationCode}).</p>
                        {payCfg?.paymentInfo?.trim() ? (
                          <p className="whitespace-pre-line"><span className="font-semibold">Formas de pago:</span>{'\n'}{payCfg.paymentInfo}</p>
                        ) : !payCfg?.paymentQrUrl ? (
                          <p className="text-orange-700/80">El restaurante aún no registró sus datos de pago; te llegarán en el correo de confirmación.</p>
                        ) : null}
                        {payCfg?.paymentQrUrl && (
                          <div className="pt-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={payCfg.paymentQrUrl} alt="QR de pago del restaurante" className="h-44 w-44 rounded-lg border border-orange-200 object-contain bg-white" />
                            <p className="text-xs text-orange-700 mt-1">Escanea este QR para pagar tu adelanto.</p>
                          </div>
                        )}
                      </div>
                      {isAuthenticated ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select value={proofMethod} onChange={(e) => setProofMethod(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                            <option value="YAPE">Yape</option>
                            <option value="PLIN">Plin</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                          </select>
                          <input ref={proofInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProof(f); }} />
                          <button onClick={() => proofInputRef.current?.click()} disabled={uploadingProof} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                            {uploadingProof ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {uploadingProof ? 'Subiendo…' : 'Subir comprobante'}
                          </button>
                        </div>
                      ) : (
                        <Link href="/login" className="inline-block text-sm font-semibold text-orange-600 hover:underline">
                          Inicia sesión para subir tu comprobante →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {reservation.notes && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notas</p>
                  <p className="text-gray-600 text-sm">{reservation.notes}</p>
                </div>
              )}
              {reservation.isEventRelated && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Vinculada al evento: {reservation.relatedEventName}
                  </span>
                </div>
              )}
              {reservation.status === 'COMPLETED' && !reviewSubmitted && (
                <div className="pt-6 border-t border-gray-100">
                  {!showReviewForm ? (
                    <button onClick={() => setShowReviewForm(true)} className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 shadow-sm text-yellow-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 transform hover:scale-[1.01]">
                      <Star className="h-5 w-5 fill-yellow-900 text-yellow-900" />
                      Dejar una reseña del restaurante
                    </button>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-5 bg-white border border-gray-100 shadow-sm p-5 rounded-2xl">
                      <h4 className="font-display text-lg font-semibold text-gray-900">Califica tu experiencia</h4>
                      
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Puntuación General *</label>
                        <StarRating value={reviewScore} onChange={setReviewScore} />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Comida (opc.)</label>
                          <StarRating value={foodScore} onChange={setFoodScore} size="sm" />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Servicio (opc.)</label>
                          <StarRating value={serviceScore} onChange={setServiceScore} size="sm" />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Ambiente (opc.)</label>
                          <StarRating value={ambianceScore} onChange={setAmbianceScore} size="sm" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comentario (opcional)</label>
                        <textarea 
                          value={comment} 
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                          rows={3}
                          placeholder="¿Qué tal estuvo tu visita? Cuenta a otros usuarios tu experiencia."
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={submittingReview || reviewScore === 0} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                          {submittingReview ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                          {submittingReview ? 'Enviando...' : 'Enviar reseña'}
                        </button>
                        <button type="button" onClick={() => setShowReviewForm(false)} className="px-6 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              {reviewSubmitted && (
                 <div className="pt-5 pb-2 border-t border-gray-100 text-center flex flex-col items-center justify-center gap-2">
                   <div className="h-10 w-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-1">
                     <CheckCircle className="h-6 w-6" />
                   </div>
                   <span className="font-semibold text-gray-900 text-lg">¡Gracias por tu reseña!</span>
                   <p className="text-sm text-gray-500">Tu opinión ayuda a otros turistas a elegir mejor.</p>
                 </div>
              )}
            </div>
          </div>
        )}

        {!search && !isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-400 mb-4">
              <Search className="h-7 w-7" />
            </div>
            <p className="text-gray-500 text-sm">
              Ingresa tu código de confirmación, p. ej.{' '}
              <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">RES-XXXXXXXX</code>
            </p>
            <p className="text-gray-400 text-xs mt-1">Lo recibiste al crear tu reserva.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReservationLookupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ReservationLookupContent />
    </Suspense>
  );
}
