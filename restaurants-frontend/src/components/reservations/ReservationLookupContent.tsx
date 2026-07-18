'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, Calendar, CheckCircle, XCircle, Clock, ArrowLeft,
  Star, Wallet, Upload, Loader2, UtensilsCrossed, Users,
  Phone, StickyNote, Ticket, MapPin, AlertCircle
} from 'lucide-react';
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

function StarRating({ value, onChange, size = 'md' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'md' }) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} onMouseEnter={() => setHovered(i)}
          className="focus:outline-none transition-transform hover:scale-110 active:scale-95">
          <Star className={cn(iconSize, 'transition-colors', (hovered || value) >= i
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 dark:text-gray-600')} />
        </button>
      ))}
    </div>
  );
}

const STATUS_CONFIG = {
  CONFIRMED: { icon: CheckCircle, bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' },
  PENDING:   { icon: Clock,        bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-200 dark:border-amber-700/40',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-400',  badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' },
  CANCELLED: { icon: XCircle,      bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-200 dark:border-red-700/40',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500',    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' },
  COMPLETED: { icon: CheckCircle,  bg: 'bg-gray-50 dark:bg-gray-700/30',     border: 'border-gray-200 dark:border-gray-600/40',     text: 'text-gray-600 dark:text-gray-400',     dot: 'bg-gray-400',   badge: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' },
  NO_SHOW:   { icon: AlertCircle,  bg: 'bg-gray-50 dark:bg-gray-700/30',     border: 'border-gray-200 dark:border-gray-600/40',     text: 'text-gray-600 dark:text-gray-400',     dot: 'bg-gray-400',   badge: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' },
} as const;

export function ReservationLookupContent({ isDashboard = false }: { isDashboard?: boolean }) {
  const searchParams = useSearchParams();
  const defaultCode = searchParams.get('code') || '';
  const [code, setCode] = useState(defaultCode);
  const [search, setSearch] = useState(defaultCode);

  const { data: reservation, isLoading, error } = useReservationByCode(search);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [proofMethod, setProofMethod] = useState('YAPE');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofDone, setProofDone] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);
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

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewScore, setReviewScore] = useState(0);
  const [foodScore, setFoodScore] = useState(0);
  const [serviceScore, setServiceScore] = useState(0);
  const [ambianceScore, setAmbianceScore] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const { createRating, loading: submittingReview } = useRatings();

  useEffect(() => {
    if (defaultCode) { setCode(defaultCode); setSearch(defaultCode.toUpperCase().trim()); }
  }, [defaultCode]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(code.toUpperCase().trim()); };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewScore || !reservation) { toast.error('Por favor, selecciona una puntuación general'); return; }
    try {
      await createRating({
        reservationId: reservation.id,
        score: reviewScore,
        foodScore: foodScore || undefined,
        serviceScore: serviceScore || undefined,
        ambianceScore: ambianceScore || undefined,
        comment: comment || undefined,
      });
      toast.success('¡Reseña enviada!');
      setReviewSubmitted(true);
      setShowReviewForm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar reseña');
    }
  };

  const statusCfg = reservation ? (STATUS_CONFIG[reservation.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.COMPLETED) : null;
  const StatusIcon = statusCfg?.icon ?? Clock;

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300', { 'min-h-0 bg-transparent': isDashboard })}>

      {/* ---- HERO HEADER (solo en página standalone) ---- */}
      {!isDashboard && (
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          {/* Glows */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-[80px]" />
            <div className="absolute bottom-0 left-1/3 h-40 w-80 rounded-full bg-orange-300/20 dark:bg-orange-600/20 blur-[60px]" />
          </div>
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-px bg-white/20 dark:bg-orange-500/40" />

          <div className="relative mx-auto max-w-2xl px-4 pt-6 pb-8">
            <Link href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold mb-6 transition-all bg-white/15 dark:bg-gray-700/60 hover:bg-white/25 dark:hover:bg-gray-700 text-white dark:text-gray-200 border border-white/25 dark:border-gray-600 backdrop-blur-sm shadow-sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
            </Link>

            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 dark:bg-orange-500/20 border border-white/25 dark:border-orange-500/30 backdrop-blur-sm mb-4 shadow-xl">
                <Calendar className="h-7 w-7 text-white dark:text-orange-400" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
                Consulta tu Reserva
              </h1>
              <p className="text-white/70 dark:text-gray-400 text-sm mb-6">
                Ingresa el código de confirmación que recibiste
              </p>

              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej: RES-AB12CD34"
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-white/20 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-orange-500/50 font-mono uppercase shadow-md" />
                </div>
                <button type="submit"
                  className="px-6 py-3.5 bg-white dark:bg-orange-500 text-orange-600 dark:text-white font-bold text-sm rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all shadow-md whitespace-nowrap">
                  Buscar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ---- DASHBOARD HEADER ---- */}
      {isDashboard && (
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Buscar Reserva</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-5">Ingresa el código de confirmación que recibiste.</p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: RES-AB12CD34"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono uppercase" />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-colors">
              Buscar
            </button>
          </form>
        </div>
      )}

      {/* ---- CONTENT AREA ---- */}
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

        {/* Loading */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-10 text-center">
            <div className="h-10 w-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Buscando reserva...</p>
          </div>
        )}

        {/* Error */}
        {error && search && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-800/40 shadow-sm p-10 text-center animate-in fade-in duration-300">
            <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-7 w-7 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-1">No encontrada</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No existe una reserva con el código{' '}
              <code className="font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-xs">{search}</code>
            </p>
          </div>
        )}

        {/* Empty state */}
        {!search && !isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-10 text-center animate-in fade-in duration-300">
            <div className="h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
              <Ticket className="h-7 w-7 text-orange-500 dark:text-orange-400" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold text-sm mb-1">Ingresa tu código de reserva</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">
              Ej:{' '}
              <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">RES-XXXXXXXX</code>
              {' '}— lo recibiste al crear tu reserva.
            </p>
          </div>
        )}

        {/* ---- RESERVATION CARD ---- */}
        {reservation && statusCfg && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-400">

            {/* Status header bar */}
            <div className={cn('px-5 py-4 flex items-center gap-3.5 border-b', statusCfg.bg, statusCfg.border)}>
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', statusCfg.bg, 'border', statusCfg.border)}>
                <StatusIcon className={cn('h-5 w-5', statusCfg.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold', statusCfg.badge)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                    {STATUS_LABELS[reservation.status as keyof typeof STATUS_LABELS] ?? reservation.status}
                  </span>
                  <code className="font-mono text-xs text-gray-400 dark:text-gray-500">{reservation.confirmationCode}</code>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {reservation.restaurantName}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { icon: UtensilsCrossed, label: 'Restaurante', value: reservation.restaurantName || '—' },
                  { icon: Users, label: 'Cliente', value: reservation.customerName },
                  { icon: Calendar, label: 'Fecha', value: formatDate(reservation.reservationDate) },
                  { icon: Clock, label: 'Hora', value: formatTime(reservation.startTime) },
                  { icon: Users, label: 'Personas', value: String(reservation.partySize) },
                  { icon: Phone, label: 'Teléfono', value: reservation.customerPhone },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {reservation.notes && (
                <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 flex items-start gap-2">
                  <StickyNote className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{reservation.notes}</p>
                </div>
              )}

              {/* Event badge */}
              {reservation.isEventRelated && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-700/40">
                    <MapPin className="h-3 w-3" /> Evento: {reservation.relatedEventName}
                  </span>
                </div>
              )}

              {/* Payment / Advance block */}
              {!!reservation.advanceAmount && reservation.advanceAmount > 0 && reservation.status !== 'CANCELLED' && (
                <div className="border-t border-gray-100 dark:border-gray-700/60 pt-5 space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-orange-500" /> Pago de adelanto
                  </h3>

                  {reservation.paymentStatus === 'PAYMENT_VERIFIED' ? (
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                      <CheckCircle className="h-5 w-5 shrink-0" />
                      Adelanto de S/ {reservation.advanceAmount.toFixed(2)} verificado. ¡Todo en orden!
                    </div>
                  ) : reservation.paymentStatus === 'PROOF_SUBMITTED' || proofDone ? (
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400 text-sm font-medium">
                      <Clock className="h-5 w-5 shrink-0" />
                      Comprobante enviado. En revisión por el restaurante.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/40">
                        <p className="font-bold text-orange-900 dark:text-orange-300 text-base mb-0.5">
                          Adelanto requerido: S/ {reservation.advanceAmount.toFixed(2)}
                        </p>
                        <p className="text-orange-700 dark:text-orange-400 text-sm">
                          Referencia:{' '}
                          <code className="bg-orange-100 dark:bg-orange-900/50 px-1.5 py-0.5 rounded font-mono text-xs">{reservation.confirmationCode}</code>
                        </p>
                      </div>

                      {payCfg?.paymentInfo?.trim() || payCfg?.paymentQrUrl ? (
                        <div className="p-4 rounded-xl bg-white dark:bg-gray-700/40 border-2 border-orange-200 dark:border-orange-700/50 shadow-sm space-y-3">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-orange-500" /> Instrucciones de pago
                          </h4>
                          {payCfg?.paymentInfo?.trim() && (
                            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line leading-relaxed border border-gray-100 dark:border-gray-700">
                              {payCfg.paymentInfo}
                            </div>
                          )}
                          {payCfg?.paymentQrUrl && (
                            <div className="flex flex-col items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={payCfg.paymentQrUrl} alt="QR de pago" className="h-48 w-48 rounded-xl border-2 border-orange-200 dark:border-orange-700/50 object-contain bg-white shadow-sm" />
                              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Escanea con Yape o Plin</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400 text-sm">
                          El restaurante aún no registró sus datos de pago. Los recibirás en el correo de confirmación.
                        </div>
                      )}

                      {isAuthenticated ? (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600/60 space-y-3">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Sube tu comprobante de pago</p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <select value={proofMethod} onChange={(e) => setProofMethod(e.target.value)}
                              className="rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                              <option value="YAPE">YAPE</option>
                              <option value="PLIN">PLIN</option>
                              <option value="TRANSFERENCIA">Transferencia bancaria</option>
                            </select>
                            <input ref={proofInputRef} type="file" accept="image/*" className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProof(f); }} />
                            <button onClick={() => proofInputRef.current?.click()} disabled={uploadingProof}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 shadow-sm hover:scale-[1.01] active:scale-[0.99]">
                              {uploadingProof ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              {uploadingProof ? 'Subiendo...' : 'Adjuntar comprobante'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Sube una foto o captura del pago realizado.</p>
                        </div>
                      ) : (
                        <Link href="/login"
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 dark:text-orange-400 hover:underline">
                          Inicia sesión para subir tu comprobante →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Review section */}
              {reservation.status === 'COMPLETED' && !reviewSubmitted && (
                <div className="border-t border-gray-100 dark:border-gray-700/60 pt-5 mt-5">
                  {!showReviewForm ? (
                    <button onClick={() => setShowReviewForm(true)}
                      className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-yellow-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-yellow-400/20 hover:scale-[1.01] active:scale-[0.99]">
                      <Star className="h-5 w-5 fill-yellow-800 text-yellow-800" />
                      Dejar una reseña
                    </button>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-4 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600/60 p-5 rounded-2xl animate-in fade-in duration-300">
                      <h4 className="font-display text-base font-bold text-gray-900 dark:text-white">Califica tu experiencia</h4>

                      <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">Puntuación general *</label>
                        <StarRating value={reviewScore} onChange={setReviewScore} />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Comida', value: foodScore, setter: setFoodScore },
                          { label: 'Servicio', value: serviceScore, setter: setServiceScore },
                          { label: 'Ambiente', value: ambianceScore, setter: setAmbianceScore },
                        ].map(({ label, value, setter }) => (
                          <div key={label} className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
                            <StarRating value={value} onChange={setter} size="sm" />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Comentario</label>
                        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                          placeholder="¿Qué tal estuvo tu visita? Cuéntaselo a otros comensales."
                          className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all resize-none" />
                      </div>

                      <div className="flex gap-3">
                        <button type="submit" disabled={submittingReview || reviewScore === 0}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 hover:scale-[1.01]">
                          {submittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {submittingReview ? 'Enviando...' : 'Enviar reseña'}
                        </button>
                        <button type="button" onClick={() => setShowReviewForm(false)}
                          className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-bold text-sm rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {reviewSubmitted && (
                <div className="border-t border-gray-100 dark:border-gray-700/60 pt-5 mt-5 text-center">
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">¡Gracias por tu reseña!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Tu opinión ayuda a otros turistas a elegir mejor.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
