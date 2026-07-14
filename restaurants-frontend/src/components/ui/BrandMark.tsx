import { useId } from 'react';

/** Isotipo de marca "RestoPoint": pin de ubicación con cubiertos. */
export function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  const gradId = useId();

  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label="RestoPoint">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA600" />
          <stop offset="100%" stopColor="#FF6A00" />
        </linearGradient>
      </defs>

      <path
        d="M256 32 C161 32 84 109 84 204 C84 326 256 480 256 480 C256 480 428 326 428 204 C428 109 351 32 256 32 Z"
        fill={`url(#${gradId})`}
      />

      {/* Tenedor */}
      <rect x="214" y="140" width="6" height="52" rx="3" fill="#FFFFFF" />
      <rect x="223" y="140" width="6" height="52" rx="3" fill="#FFFFFF" />
      <rect x="232" y="140" width="6" height="52" rx="3" fill="#FFFFFF" />
      <path d="M212 192 L241 192 L226.5 206 Z" fill="#FFFFFF" />
      <rect x="219" y="204" width="14" height="66" rx="7" fill="#FFFFFF" />

      {/* Cuchara */}
      <ellipse cx="286" cy="164" rx="19" ry="27" fill="#FFFFFF" />
      <rect x="279" y="188" width="14" height="82" rx="7" fill="#FFFFFF" />
    </svg>
  );
}
