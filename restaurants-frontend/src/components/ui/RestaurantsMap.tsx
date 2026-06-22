'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import type { Restaurant } from '@/types/restaurant';

const DEFAULT_CENTER: [number, number] = [-9.2964, -75.9967]; // Tingo María

const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="30" height="38" viewBox="0 0 24 24" fill="#E8590C" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,.35))">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.6" fill="#ffffff"/>
  </svg>`,
  iconSize: [30, 38],
  iconAnchor: [15, 38],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
    }
  }, [points, map]);
  return null;
}

export default function RestaurantsMap({ restaurants, height = 600 }: { restaurants: Restaurant[]; height?: number }) {
  const withCoords = restaurants.filter((r) => !!r.latitude && !!r.longitude);
  const points = withCoords.map((r) => [r.latitude, r.longitude] as [number, number]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
      <MapContainer center={DEFAULT_CENTER} zoom={14} style={{ height }} scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds points={points} />
        {withCoords.map((r) => (
          <Marker key={r.id} position={[r.latitude, r.longitude]} icon={pinIcon}>
            <Popup>
              <div className="min-w-[190px]">
                <p className="font-display font-semibold text-[15px] mb-1 text-gray-900 dark:text-gray-50">{r.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{r.avgRating?.toFixed(1) ?? '0.0'}</span>
                  <span>({r.totalRatings ?? 0})</span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span>{r.city}</span>
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
