'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Star, UtensilsCrossed } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import type { Restaurant } from '@/types/restaurant';

const DEFAULT_CENTER: [number, number] = [-9.2964, -75.9967]; // Tingo María

// Tiles CARTO (gratis, sin API key): paletas limpias y neutras que combinan con
// la marca "Brasa & Selva", a diferencia del estilo por defecto de OSM (recargado,
// carreteras rojas gruesas, tipografía densa) que desentonaba con el resto de la UI.
const TILE_URL = {
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function makePin(active: boolean) {
  const color = active ? '#9A3412' : '#E8590C';
  const scale = active ? 1.25 : 1;
  return L.divIcon({
    className: '',
    html: `<svg width="${30 * scale}" height="${38 * scale}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,.35))">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.6" fill="#ffffff"/>
    </svg>`,
    iconSize: [30 * scale, 38 * scale],
    iconAnchor: [15 * scale, 38 * scale],
  });
}

const defaultPin = makePin(false);
const activePin = makePin(true);

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
    }
  }, [points, map]);
  return null;
}

/** Cuando cambia la selección (desde la lista lateral), centra el mapa y abre el popup del marcador. */
function FlyToSelected({
  selected,
  markerRefs,
}: {
  selected?: Restaurant;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!selected || !selected.latitude || !selected.longitude) return;
    map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 15), { duration: 0.6 });
    const marker = markerRefs.current[selected.id];
    marker?.openPopup();
  }, [selected, map, markerRefs]);
  return null;
}

interface Props {
  restaurants: Restaurant[];
  className?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export default function RestaurantsMap({ restaurants, className, selectedId, onSelect }: Props) {
  const theme = useUiStore((s) => s.theme);
  const withCoords = restaurants.filter((r) => !!r.latitude && !!r.longitude);
  const points = withCoords.map((r) => [r.latitude, r.longitude] as [number, number]);
  const selected = withCoords.find((r) => r.id === selectedId);
  const markerRefs = useRef<Record<string, L.Marker>>({});

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 h-[360px] sm:h-[460px] lg:h-[600px]', className)}>
      <MapContainer center={DEFAULT_CENTER} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer key={theme} url={TILE_URL[theme]} attribution={TILE_ATTRIBUTION} />
        <FitBounds points={points} />
        <FlyToSelected selected={selected} markerRefs={markerRefs} />
        {withCoords.map((r) => (
          <Marker
            key={r.id}
            position={[r.latitude, r.longitude]}
            icon={r.id === selectedId ? activePin : defaultPin}
            ref={(instance) => {
              if (instance) markerRefs.current[r.id] = instance;
              else delete markerRefs.current[r.id];
            }}
            eventHandlers={{ click: () => onSelect?.(r.id) }}
          >
            <Popup maxWidth={230} minWidth={200}>
              <div>
                <div className="flex gap-2.5 mb-2.5">
                  <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-orange-200 to-rose-200 flex items-center justify-center">
                    {r.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.coverImageUrl} alt={r.name} className="h-full w-full object-cover" />
                    ) : (
                      <UtensilsCrossed className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-[14px] leading-tight text-gray-900 dark:text-gray-50 line-clamp-2">{r.name}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                      <span className="font-medium">{r.avgRating?.toFixed(1) ?? '0.0'}</span>
                      <span>({r.totalRatings ?? 0})</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/restaurants/${r.slug}`}
                  className="map-popup-btn flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 text-xs font-semibold rounded-lg transition-colors"
                >
                  Ver y reservar
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
