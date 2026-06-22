'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SpotlightTour, type TourStep } from './SpotlightTour';

/**
 * Guía del DUEÑO de restaurante: aparece una sola vez, la primera vez que entra
 * al panel (tras aprobarse su cuenta). Recorre las secciones del dashboard.
 */
const STEPS: TourStep[] = [
  {
    title: '¡Bienvenido a tu panel!',
    text: 'Tu cuenta fue aprobada. Te muestro rápidamente dónde está cada cosa para administrar tu restaurante. Puedes saltar la guía cuando quieras.',
  },
  { selector: '[data-tour="nav-restaurants"]', title: 'Tu restaurante', text: 'Edita los datos, fotos, ubicación y horarios de tu restaurante desde aquí.' },
  { selector: '[data-tour="nav-menus"]', title: 'Menús y platos', text: 'Crea tus cartas y agrega platos con precios, fotos y categorías.' },
  { selector: '[data-tour="nav-promotions"]', title: 'Promociones', text: 'Publica ofertas y promociones para atraer más clientes.' },
  {
    selector: '[data-tour="nav-reservationConfig"]',
    title: 'Reglas de reserva y pagos',
    text: 'Aquí defines si pides adelanto, sus condiciones, y registras tus formas de pago. Sube la foto de tu QR (Yape/Plin) para que el cliente pueda pagar y verifiques sus comprobantes.',
  },
  { selector: '[data-tour="nav-reservations"]', title: 'Reservas', text: 'Revisa, confirma o cancela las reservas que recibes de los clientes.' },
  { selector: '[data-tour="nav-reports"]', title: 'Reportes', text: 'Consulta estadísticas y el rendimiento de tu restaurante.' },
];

export function OwnerOnboardingTour() {
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);

  const active = !!hasHydrated && !!user && user.role === 'RESTAURANTE_OWNER' && pathname.startsWith('/dashboard');
  if (!user) return null;

  return <SpotlightTour steps={STEPS} storageKey={`owner_onboarding_seen_${user.userId}`} active={active} />;
}
