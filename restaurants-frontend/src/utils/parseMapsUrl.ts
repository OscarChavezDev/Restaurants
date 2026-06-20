/**
 * Extrae lat/lng de un enlace de Google Maps (o de un par "lat,lng" pegado directo).
 * Soporta los formatos más comunes:
 *   .../place/Nombre/@-9.296,-75.997,17z/data=...!3d-9.296!4d-75.997   (pin real)
 *   .../maps/@-9.296,-75.997,15z                                       (centro del mapa)
 *   ...?q=-9.296,-75.997  ?ll=...  ?destination=...  ?center=...
 *   "-9.296,-75.997"                                                   (pegado directo)
 *
 * Nota: los enlaces cortos (maps.app.goo.gl / goo.gl/maps) NO contienen las
 * coordenadas (son redirecciones), así que no se pueden parsear sin abrirlos.
 */
export function parseLatLngFromMapsUrl(input: string): { lat: number; lng: number } | null {
  if (!input) return null;
  const s = input.trim();

  // El pin real del lugar va en !3d<lat>!4d<lng>; tiene prioridad sobre @ (centro del mapa).
  const patterns: RegExp[] = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|ll|destination|center|sll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  ];

  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (isValid(lat, lng)) return { lat: round6(lat), lng: round6(lng) };
    }
  }

  // Par "lat,lng" pegado directamente.
  const raw = s.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (raw) {
    const lat = parseFloat(raw[1]);
    const lng = parseFloat(raw[2]);
    if (isValid(lat, lng)) return { lat: round6(lat), lng: round6(lng) };
  }

  return null;
}

function isValid(lat: number, lng: number): boolean {
  return !Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function round6(n: number): number {
  return Number(n.toFixed(6));
}
