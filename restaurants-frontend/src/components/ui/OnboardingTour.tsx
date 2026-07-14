'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { SpotlightTour, type TourStep } from './SpotlightTour';

/**
 * Guía del CLIENTE: aparece una sola vez, la primera vez que un cliente inicia
 * sesión, en /restaurants. Resalta los filtros, el listado y el asistente.
 */
const STEPS: TourStep[] = [
  {
    title: '¡Bienvenido/a a Fogón Selva!',
    text: 'Ya tienes tu cuenta lista. Te muestro paso a paso cómo encontrar, guardar y reservar tu restaurante ideal. Puedes saltar la guía cuando quieras.',
  },
  { selector: '[data-tour="search"]', title: 'Busca por nombre', text: 'Escribe aquí el nombre de un restaurante para encontrarlo al instante.' },
  { selector: '[data-tour="filter-categories"]', title: '¿Qué te apetece?', text: 'Pulsa aquí para filtrar por tipo de comida: peruana, parrillas, pizzas, menú y más.' },
  { selector: '[data-tour="filter-favorites"]', title: 'Tus favoritos', text: 'Activa este filtro para ver SOLO los restaurantes que marcaste con el corazón.' },
  { selector: '[data-tour="filter-price"]', title: 'Rango de precio', text: 'Filtra según tu presupuesto: económico ($), medio ($$) o alto ($$$).' },
  { selector: '[data-tour="filter-nearby"]', title: 'Cerca de mí', text: 'Usa tu ubicación para ver los restaurantes más cercanos a ti (5 o 10 km).' },
  { selector: '[data-tour="view-toggle"]', title: 'Lista o mapa', text: 'Cambia entre ver los resultados como lista o ubicados en el mapa.' },
  { selector: '[data-tour="results"]', title: 'Reserva y guarda', text: 'Toca una tarjeta para ver el menú, las fotos y reservar. Usa el corazón de cada tarjeta para guardarla en tus favoritos.' },
  {
    selector: '[data-tour="assistant"]',
    title: 'Tu asistente con IA',
    text: 'Aquí tienes tu asistente. Escríbele el código de tu reserva y podrás consultar su estado, ver las formas de pago y, cuando tu reserva requiera adelanto, finalizar el pago subiendo tu comprobante. Pregúntale lo que necesites con tus propias palabras.',
  },
];

export function OnboardingTour() {
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  // Consider "new account" if created within the last 24 hours.
  const isNewAccount = user.createdAt 
    ? (new Date().getTime() - new Date(user.createdAt).getTime()) < 24 * 60 * 60 * 1000 
    : false;

  const active = !!hasHydrated && user.role === 'CLIENTE' && pathname === '/restaurants' && isNewAccount;

  return <SpotlightTour steps={STEPS} storageKey={`onboarding_seen_${user.userId}`} active={active} />;
}
