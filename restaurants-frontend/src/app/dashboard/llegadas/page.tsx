'use client';

import { useEffect, useRef, useState } from 'react';
import { QrCode, CheckCircle2, XCircle, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useArriveReservation } from '@/hooks/useReservations';
import { formatTime } from '@/utils/formatters';
import type { Reservation } from '@/types/reservation';

/** Extrae el código de confirmación (ej. RES-XXXXXXXX) del QR escaneado. */
function extractConfirmationCode(decodedText: string): string | null {
  const direct = decodedText.match(/RES-[A-Z0-9]+/i);
  if (direct) return direct[0].toUpperCase();
  try {
    const url = new URL(decodedText);
    const code = url.searchParams.get('code');
    if (code) return code.toUpperCase();
  } catch {
    // no es una URL, ignorar
  }
  return null;
}

export default function LlegadasPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const arriveMutation = useArriveReservation();
  const [recentArrivals, setRecentArrivals] = useState<Reservation[]>([]);
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: import('html5-qrcode').Html5QrcodeScanner | null = null;
    let cancelled = false;

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (cancelled || !containerRef.current) return;
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: 250, rememberLastUsedCamera: true },
        false
      );
      scanner.render(handleScanSuccess, () => {});
    }).catch(() => setScannerError('No se pudo cargar el lector de QR.'));

    return () => {
      cancelled = true;
      scanner?.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    const code = extractConfirmationCode(decodedText);
    if (!code) {
      toast.error('El código QR escaneado no corresponde a una reserva');
      return;
    }

    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.code === code && now - lastScanRef.current.at < 5000) {
      return; // evita procesar el mismo QR varias veces seguidas
    }
    lastScanRef.current = { code, at: now };

    arriveMutation.mutate(code, {
      onSuccess: (reservation) => {
        toast.success(`${reservation.customerName} confirmó su llegada`);
        setRecentArrivals((prev) => [reservation, ...prev].slice(0, 10));
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message ?? 'No se pudo confirmar la llegada');
      },
    });
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 pb-4 mb-6 pt-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
          <div className="p-2.5 bg-orange-500/10 rounded-2xl">
            <QrCode className="h-7 w-7 text-orange-500" />
          </div>
          Confirmar llegada
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
          Escanea el código QR del correo de confirmación del cliente para marcar su llegada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm p-6">
          {scannerError ? (
            <p className="text-sm text-red-500 dark:text-red-400">{scannerError}</p>
          ) : (
            <div id="qr-reader" ref={containerRef} />
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Si el navegador no tiene acceso a la cámara, puedes subir una foto del QR usando la opción
            &quot;Scan an Image File&quot; del lector.
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm p-6">
          <h2 className="font-display text-base font-semibold text-gray-900 dark:text-white mb-4">
            Llegadas confirmadas en esta sesión
          </h2>
          {recentArrivals.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Todavía no escaneaste ninguna reserva.</p>
          ) : (
            <div className="space-y-3">
              {recentArrivals.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{r.customerName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(r.startTime)}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {r.partySize} personas</span>
                    </p>
                  </div>
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{r.confirmationCode}</span>
                </div>
              ))}
            </div>
          )}
          {arriveMutation.isError && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-3 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> El último escaneo no se pudo procesar — revisa el código o que la reserva esté confirmada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
