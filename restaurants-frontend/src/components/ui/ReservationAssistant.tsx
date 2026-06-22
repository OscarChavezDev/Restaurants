'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, Send, Bot, Paperclip, Loader2 } from 'lucide-react';
import { reservationService } from '@/services/reservationService';
import { reservationConfigService, type ReservationConfig } from '@/services/reservationConfigService';
import { paymentService } from '@/services/paymentService';
import { assistantService } from '@/services/assistantService';
import { uploadToCloudinary, validateImage } from '@/utils/uploadToCloudinary';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatTime, STATUS_LABELS } from '@/utils/formatters';
import type { Reservation } from '@/types/reservation';
import { cn } from '@/utils/cn';

type Chip = { label: string; onClick: () => void };
type Msg = { id: number; from: 'bot' | 'user'; text: string; chips?: Chip[]; image?: string };

export function ReservationAssistant() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [config, setConfig] = useState<ReservationConfig | null>(null);
  const [mode, setMode] = useState<'code' | 'allergies' | 'idle'>('code');
  const [method, setMethod] = useState('YAPE');
  const [busy, setBusy] = useState(false);
  const idRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const nextId = () => ++idRef.current;
  const bot = useCallback((text: string, chips?: Chip[], image?: string) =>
    setMessages((m) => [...m, { id: nextId(), from: 'bot', text, chips, image }]), []);
  const user = (text: string) => setMessages((m) => [...m, { id: nextId(), from: 'user', text }]);

  // Saludo inicial al abrir por primera vez
  useEffect(() => {
    if (open && messages.length === 0) {
      bot('¡Hola! Soy el asistente de Tingo Restaurants. Te ayudo con tu reserva: estado, pago, comprobante y preferencias.');
      bot('Para empezar, escribe el código de tu reserva (ej. RES-XXXXXXXX).');
      setMode('code');
    }
  }, [open, messages.length, bot]);

  // Autoscroll
  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  if (pathname.startsWith('/dashboard')) return null;

  // ── Acciones ──────────────────────────────────────────────
  const menuChips = (r: Reservation): Chip[] => [
    { label: 'Estado de mi reserva', onClick: () => actStatus(r) },
    { label: 'Estado del pago', onClick: () => actPayment(r) },
    { label: 'Subir comprobante', onClick: () => actProof(r) },
    { label: 'Alergias / preferencias', onClick: () => actAllergies(r) },
    { label: 'Consultar otra reserva', onClick: () => actReset() },
  ];
  const showMenu = (r: Reservation) => bot('¿En qué te ayudo?', menuChips(r));

  // Consulta libre → IA (Gemini). Si no está configurada, cae a las opciones.
  const askAI = async (text: string) => {
    try {
      setBusy(true);
      const history = messages
        .filter((m) => m.text)
        .slice(-8)
        .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
      history.push({ role: 'user', content: text });
      const res = await assistantService.chat(reservation?.confirmationCode, history);
      if (res.configured && res.reply) {
        // Respuesta de IA sin repetir el menú (las acciones están en la barra inferior).
        bot(res.reply);
      } else if (reservation) {
        bot('Puedo ayudarte con esto:', menuChips(reservation));
      } else {
        bot('Para ayudarte con tu reserva, escribe tu código (ej. RES-XXXXXXXX).');
      }
    } catch {
      if (reservation) bot('Lo siento, no pude procesar tu consulta. Usa los botones de abajo.');
      else bot('Escribe tu código de reserva (ej. RES-XXXXXXXX) para empezar.');
    } finally {
      setBusy(false);
    }
  };

  const lookup = async (raw: string) => {
    const code = raw.toUpperCase().trim();
    try {
      setBusy(true);
      const r = await reservationService.getByCode(code);
      setReservation(r);
      reservationConfigService.get(r.restaurantId).then(setConfig).catch(() => {});
      bot(`Encontré tu reserva en ${r.restaurantName ?? 'el restaurante'}, a nombre de ${r.customerName}.`);
      setMode('idle');
      showMenu(r);
    } catch {
      bot('No encontré ninguna reserva con ese código. Revísalo e intenta de nuevo (ej. RES-XXXXXXXX).');
    } finally {
      setBusy(false);
    }
  };

  const actStatus = (r: Reservation) => {
    bot(`Tu reserva ${r.confirmationCode} está: ${STATUS_LABELS[r.status]}.`);
    bot(`${formatDate(r.reservationDate)} a las ${formatTime(r.startTime)} · ${r.partySize} ${r.partySize === 1 ? 'persona' : 'personas'}.`);
  };

  const actPayment = (r: Reservation) => {
    if (!r.advanceAmount || r.advanceAmount <= 0) { bot('Esta reserva no requiere adelanto. ¡Solo preséntate el día de tu reserva!'); return; }
    if (r.paymentStatus === 'PAYMENT_VERIFIED') { bot(`Tu adelanto de S/ ${r.advanceAmount.toFixed(2)} ya está verificado. ¡Todo listo!`); return; }
    if (r.paymentStatus === 'PROOF_SUBMITTED') { bot('Ya recibimos tu comprobante. En breve el restaurante confirmará el pago y te llegará un correo.'); return; }
    const info = config?.paymentInfo?.trim();
    bot(`El adelanto es de S/ ${r.advanceAmount.toFixed(2)} (concepto: ${r.confirmationCode}).`);
    if (info) bot(`Formas de pago del restaurante:\n${info}`);
    else if (!config?.paymentQrUrl) bot('El restaurante aún no registró sus datos de pago; te llegarán en el correo de confirmación.');
    if (config?.paymentQrUrl) bot('Escanea este QR para pagar:', undefined, config.paymentQrUrl);
    bot('Cuando hayas pagado, súbeme tu comprobante.', [{ label: 'Subir comprobante', onClick: () => actProof(r) }, { label: 'Volver al menú', onClick: () => showMenu(r) }]);
  };

  const actProof = (r: Reservation) => {
    if (!r.advanceAmount || r.advanceAmount <= 0) { bot('Esta reserva no requiere adelanto.'); return showMenu(r); }
    if (r.paymentStatus === 'PAYMENT_VERIFIED') { bot('Tu pago ya está verificado, no necesitas subir nada más.'); return showMenu(r); }
    if (!isAuthenticated) { bot('Para subir tu comprobante necesitas iniciar sesión con Google.', [{ label: 'Ir a iniciar sesión', onClick: () => { window.location.href = '/login'; } }]); return; }
    bot('¿Con qué método pagaste?', [
      { label: 'Yape', onClick: () => pickMethod(r, 'YAPE') },
      { label: 'Plin', onClick: () => pickMethod(r, 'PLIN') },
      { label: 'Transferencia', onClick: () => pickMethod(r, 'TRANSFERENCIA') },
    ]);
  };

  const pickMethod = (r: Reservation, m: string) => {
    setMethod(m);
    bot(`Pago por ${m === 'TRANSFERENCIA' ? 'transferencia' : m}. Ahora adjunta la foto de tu comprobante.`, [
      { label: 'Adjuntar comprobante', onClick: () => fileRef.current?.click() },
    ]);
  };

  const onFile = async (file: File) => {
    const err = validateImage(file);
    if (err) { bot(err); return; }
    if (!reservation) return;
    try {
      setBusy(true);
      bot('Subiendo tu comprobante…');
      const { url } = await uploadToCloudinary(file, 'payment-proofs');
      await paymentService.submitProof({ reservationId: reservation.id, amount: reservation.advanceAmount ?? 0, method, proofImageUrl: url });
      const updated = { ...reservation, paymentStatus: 'PROOF_SUBMITTED' };
      setReservation(updated);
      bot('¡Listo! Recibimos tu comprobante. El restaurante lo confirmará en breve y te llegará un correo de confirmación.');
    } catch (e: any) {
      bot(e?.response?.data?.message ?? 'No pude subir el comprobante. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const actAllergies = (r: Reservation) => {
    if (!isAuthenticated) { bot('Para guardar tus preferencias necesitas iniciar sesión.', [{ label: 'Ir a iniciar sesión', onClick: () => { window.location.href = '/login'; } }]); return; }
    setMode('allergies');
    bot('Cuéntame: ¿tienes alguna alergia o preferencia? (ej. sin maní, sin gluten, mesa tranquila). Escríbelo y lo guardo para el restaurante.');
  };

  const saveAllergies = async (text: string) => {
    if (!reservation) return;
    try {
      setBusy(true);
      await reservationService.updateSpecialRequests(reservation.id, text);
      bot(`Anotado. El restaurante verá: "${text}".`);
    } catch {
      bot('No pude guardar tus preferencias. Intenta de nuevo.');
    } finally {
      setBusy(false);
      setMode('idle');
    }
  };

  const actReset = () => {
    setReservation(null); setConfig(null); setMode('code');
    bot('Claro. Escribe el código de la otra reserva (ej. RES-XXXXXXXX).');
  };

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    user(text);
    setInput('');
    if (mode === 'allergies') { saveAllergies(text); return; }

    // Un código siempre se interpreta como búsqueda de reserva.
    if (/^res-/i.test(text)) { lookup(text); return; }

    const r = reservation;
    const t = text.toLowerCase();
    if (r) {
      // Acciones concretas por palabra clave (van por flujo, no por IA):
      if (/(comprob|voucher|recibo)/.test(t)) { actProof(r); return; }
      if (/(alerg|prefer|gluten|man[ií]|vegan|vegetar)/.test(t)) { actAllergies(r); return; }
      // Pago: lo maneja la acción para mostrar los datos reales + el QR del restaurante.
      if (/(pag|cobr|d[oó]nde|c[oó]mo pag|yape|plin|transfer|qr|cuenta|adelanto|dep[oó]sit)/.test(t)) { actPayment(r); return; }
      // El resto (preguntas libres) → IA.
      askAI(text);
      return;
    }
    askAI(text); // sin reserva cargada: la IA orienta y pide el código
  };

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          data-tour="assistant"
          onClick={() => setOpen(true)}
          className="group fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500 to-selva-500 text-white pl-3 pr-4 py-3 shadow-xl shadow-orange-500/40 ring-1 ring-white/20 hover:shadow-orange-500/60 hover:-translate-y-0.5 transition-all duration-200"
          aria-label="Abrir asistente"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-5 w-5" />
            {/* punto animado para llamar la atención */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-400 ring-2 ring-orange-500" />
            </span>
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-sm font-bold">Asistente</span>
            <span className="text-[10px] font-medium opacity-90">Reservas con IA</span>
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[60] flex flex-col w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-selva-500">
            <div className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20"><Bot className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-bold leading-tight">Asistente de reservas</p>
                <p className="text-[11px] opacity-90 leading-tight">Tingo Restaurants</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-white/90 hover:bg-white/20 transition-colors" aria-label="Cerrar"><X className="h-5 w-5" /></button>
          </div>

          {/* Mensajes */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900/40">
            {messages.map((m) => (
              <div key={m.id} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line',
                  m.from === 'user'
                    ? 'bg-orange-500 text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-bl-sm')}>
                  {m.text}
                  {m.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.image} alt="QR de pago" className="mt-2 h-40 w-40 rounded-lg border border-gray-200 dark:border-gray-600 object-contain bg-white" />
                  )}
                  {m.chips && m.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.chips.map((c, i) => (
                        <button key={i} onClick={c.onClick} className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 text-xs font-medium hover:bg-orange-100 dark:hover:bg-orange-500/25 transition-colors">
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex justify-start"><div className="rounded-2xl px-3 py-2 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600"><Loader2 className="h-4 w-4 animate-spin text-orange-500" /></div></div>}
          </div>

          {/* Barra fija de acciones rápidas (solo con reserva cargada) */}
          {reservation && (
            <div className="flex flex-wrap gap-1.5 px-2.5 pt-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              {[
                { label: 'Estado', onClick: () => actStatus(reservation) },
                { label: 'Pago', onClick: () => actPayment(reservation) },
                { label: 'Comprobante', onClick: () => actProof(reservation) },
                { label: 'Alergias', onClick: () => actAllergies(reservation) },
                { label: 'Otra reserva', onClick: () => actReset() },
              ].map((c, i) => (
                <button key={i} onClick={c.onClick} disabled={busy} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-500/20 dark:hover:text-orange-300 transition-colors disabled:opacity-50">
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 p-2.5 border-t-0 bg-white dark:bg-gray-800">
            {reservation && (
              <button onClick={() => fileRef.current?.click()} title="Adjuntar comprobante" className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Paperclip className="h-4 w-4" />
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder={mode === 'allergies' ? 'Escribe tus alergias…' : mode === 'code' ? 'Código de reserva…' : 'Escribe un mensaje…'}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button onClick={send} disabled={busy || !input.trim()} className="p-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
        </div>
      )}
    </>
  );
}
