import { useId } from 'react';

/** Isotipo de marca "RestoPoint": pin de ubicación con cubiertos — versión mejorada. */
export function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  const uid = useId();
  const grad   = `rpG-${uid}`;
  const glow   = `rpGl-${uid}`;
  const shadow = `rpSh-${uid}`;
  const inner  = `rpIn-${uid}`;

  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label="RestoPoint">
      <defs>
        {/* Degradado principal del pin: naranja cálido → rojo oscuro */}
        <linearGradient id={grad} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%"   stopColor="#FFB347" />
          <stop offset="40%"  stopColor="#F97316" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        {/* Brillo interior (reflejo superior-izquierdo) */}
        <radialGradient id={glow} cx="30%" cy="20%" r="50%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.40" />
          <stop offset="70%"  stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        {/* Sombra suave */}
        <filter id={shadow} x="-30%" y="-15%" width="160%" height="145%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#7C2D12" floodOpacity="0.45" />
        </filter>
        {/* Círculo interior blanco (reflejo) */}
        <radialGradient id={inner} cx="40%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cuerpo del pin */}
      <g filter={`url(#${shadow})`}>
        <path
          d="M256 28
             C152 28 72 108 72 208
             C72 290 150 368 212 432
             C232 454 248 470 256 480
             C264 470 280 454 300 432
             C362 368 440 290 440 208
             C440 108 360 28 256 28 Z"
          fill={`url(#${grad})`}
        />
        {/* Glow overlay */}
        <path
          d="M256 28
             C152 28 72 108 72 208
             C72 290 150 368 212 432
             C232 454 248 470 256 480
             C264 470 280 454 300 432
             C362 368 440 290 440 208
             C440 108 360 28 256 28 Z"
          fill={`url(#${glow})`}
        />
      </g>

      {/* Círculo de fondo blanco/semitransparente dentro del pin */}
      <circle cx="256" cy="200" r="102" fill="white" fillOpacity="0.15" />
      <circle cx="256" cy="200" r="102" fill={`url(#${inner})`} />

      {/* ── Tenedor (izquierda) ── */}
      {/* Dientes */}
      <rect x="206" y="122" width="9"  height="52" rx="4.5" fill="white" />
      <rect x="221" y="122" width="9"  height="52" rx="4.5" fill="white" />
      <rect x="236" y="122" width="9"  height="52" rx="4.5" fill="white" />
      {/* Unión curva */}
      <path d="M204 172 Q204 194 220.5 200 Q237 194 237 172 Z" fill="white" />
      {/* Mango */}
      <rect x="213" y="196" width="15" height="82" rx="7.5" fill="white" />

      {/* ── Cuchillo (derecha) ── */}
      {/* Hoja con curva */}
      <path d="M278 122 L278 175 Q278 195 292 200 L292 122 Z" fill="white" />
      {/* Mango */}
      <rect x="282" y="196" width="14" height="82" rx="7" fill="white" />
    </svg>
  );
}
