'use client';

import { usePathname } from 'next/navigation';
import { ThemeLangSwitch } from '@/components/ui/ThemeLangSwitch';

export function TopControls() {
  const pathname = usePathname();

  // El dashboard tiene su propia barra; el home y /restaurants (lista) los muestran inline.
  // Pero /restaurants/[slug] SÍ debe mostrar este control flotante.
  if (pathname.startsWith('/dashboard') || pathname === '/' || pathname === '/restaurants') return null;

  return (
    <div className="fixed top-3 right-4 z-50">
      <ThemeLangSwitch />
    </div>
  );
}
