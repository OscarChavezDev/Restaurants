'use client';

import { useId } from 'react';
import { useUiStore } from '@/store/uiStore';

/** Isotipo de marca "Fogón Selva": la brasa se funde en hoja en un solo trazo. */
export function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  const isDark = useUiStore((s) => s.theme === 'dark');
  const gradId = useId();
  const brasa = isDark ? '#F97A3D' : '#E8590C';
  const selva = isDark ? '#3FAE84' : '#157F5B';

  return (
    <svg viewBox="0 0 256 256" className={className} role="img" aria-label="Fogón Selva">
      <defs>
        <linearGradient id={gradId} x1="128" y1="222" x2="128" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={brasa} />
          <stop offset="1" stopColor={selva} />
        </linearGradient>
      </defs>
      <path
        d="M128 38 C150 58 168 90 170 122 C172 156 152 190 128 220 C104 190 84 156 86 122 C88 90 106 58 128 38 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M128 64 Q120 140 128 200"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.55}
        strokeWidth={4}
        strokeLinecap="round"
      />
    </svg>
  );
}
