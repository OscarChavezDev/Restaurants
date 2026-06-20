'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Pin de marca (Brasa) como divIcon — sin assets externos.
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="32" height="40" viewBox="0 0 24 24" fill="#E8590C" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,.35))">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.6" fill="#ffffff"/>
  </svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

export interface LocationMapProps {
  lat: number;
  lng: number;
  height?: number;
  zoom?: number;
}

/** Mapa de solo lectura para mostrar la ubicación de un restaurante. */
export default function LocationMap({ lat, lng, height = 220, zoom = 15 }: LocationMapProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        style={{ height }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[lat, lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  );
}
