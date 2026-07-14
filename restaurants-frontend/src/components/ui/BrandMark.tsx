import { useId } from 'react';

/** Isotipo de marca "RestoPoint": pin de ubicación con cubiertos. */
export function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  const uid = useId();
  const gradId = `rpGrad-${uid}`;
  const glowId = `rpGlow-${uid}`;
  const shadowId = `rpShadow-${uid}`;

  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label="RestoPoint">
      <defs>
        <linearGradient id={gradId} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#FFA928" />
          <stop offset="45%" stopColor="#FF8F00" />
          <stop offset="100%" stopColor="#E64A00" />
        </linearGradient>
        <radialGradient id={glowId} cx="32%" cy="18%" r="45%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.30" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <filter id={shadowId} x="-40%" y="-20%" width="180%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#8A2E00" floodOpacity="0.38" />
        </filter>
      </defs>

      <g filter={`url(#${shadowId})`}>
        <path
          d="M256 32 C161 32 84 109 84 204 C84 326 256 480 256 480 C256 480 428 326 428 204 C428 109 351 32 256 32 Z"
          fill={`url(#${gradId})`}
          stroke="#3D1400"
          strokeWidth="22"
          strokeLinejoin="round"
        />
        <path
          d="M256 32 C161 32 84 109 84 204 C84 326 256 480 256 480 C256 480 428 326 428 204 C428 109 351 32 256 32 Z"
          fill={`url(#${glowId})`}
        />
      </g>

      {/* Tenedor */}
      <rect x="203" y="126" width="12" height="64" rx="6" fill="#FFFFFF" />
      <rect x="221" y="126" width="12" height="64" rx="6" fill="#FFFFFF" />
      <rect x="239" y="126" width="12" height="64" rx="6" fill="#FFFFFF" />
      <path d="M201 188 C201 201 210 210 226.5 215 C243 210 251 201 251 188 Z" fill="#FFFFFF" />
      <rect x="213" y="206" width="27" height="78" rx="13.5" fill="#FFFFFF" />

      {/* Cuchara */}
      <ellipse cx="292" cy="158" rx="28" ry="38" fill="#FFFFFF" />
      <rect x="278" y="188" width="27" height="96" rx="13.5" fill="#FFFFFF" />
    </svg>
  );
}
