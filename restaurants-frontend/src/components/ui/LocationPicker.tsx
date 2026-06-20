'use client';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { Link2, Check, Loader2 } from 'lucide-react';
import { parseLatLngFromMapsUrl } from '@/utils/parseMapsUrl';
import { api } from '@/services/api';

// Centro por defecto: Plaza de Armas de Tingo María
const DEFAULT_CENTER: [number, number] = [-9.2964, -75.9967];

// Pin de marca (Brasa) como divIcon — evita el problema de assets de Leaflet con bundlers.
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="34" height="42" viewBox="0 0 24 24" fill="#E8590C" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,.35))">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.6" fill="#ffffff"/>
  </svg>`,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

// Re-centra el mapa cuando cambian las coords desde fuera (ej. al cargar el form de edición).
function Recenter({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

export default function LocationPicker({ lat, lng, onChange, height = 300 }: LocationPickerProps) {
  const hasPos = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng);
  const center: [number, number] = hasPos ? [lat as number, lng as number] : DEFAULT_CENTER;

  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [linkOk, setLinkOk] = useState(false);
  const [resolving, setResolving] = useState(false);

  const applyLink = async () => {
    setLinkError('');
    setLinkOk(false);
    setResolvedName(null);

    // Siempre resolvemos vía backend: así obtenemos el pin EXACTO del lugar y su nombre,
    // tanto para enlaces cortos (maps.app.goo.gl) como completos.
    try {
      setResolving(true);
      const res = await api.get('/v1/geo/resolve', { params: { url: linkInput } });
      const { lat, lng, name } = res.data.data as { lat: number; lng: number; name: string | null };
      setLinkOk(true);
      setResolvedName(name ?? null);
      onChange(lat, lng);
    } catch {
      // Fallback local por si el backend no estuviera disponible.
      const parsed = parseLatLngFromMapsUrl(linkInput);
      if (parsed) {
        setLinkOk(true);
        onChange(parsed.lat, parsed.lng);
      } else {
        setLinkError('No se pudieron extraer las coordenadas. Verifica que sea un enlace de Google Maps válido.');
      }
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Pegar enlace de Google Maps */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={linkInput}
            onChange={(e) => { setLinkInput(e.target.value); setLinkOk(false); setLinkError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } }}
            placeholder="Pega el enlace de Google Maps o lat,lng"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          type="button"
          onClick={applyLink}
          disabled={resolving}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : linkOk ? <Check className="h-4 w-4" /> : null}
          {resolving ? 'Resolviendo...' : 'Usar enlace'}
        </button>
      </div>
      {linkError && <p className="text-xs text-red-500">{linkError}</p>}
      {linkOk && !linkError && (
        <p className="text-xs text-green-600">
          {resolvedName ? <>Ubicación fijada: <strong>{resolvedName}</strong></> : 'Ubicación fijada desde el enlace.'}
        </p>
      )}

      {/* Mapa (confirmación visual; también puedes hacer clic para ajustar) */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <MapContainer center={center} zoom={15} style={{ height }} scrollWheelZoom>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <ClickHandler onPick={onChange} />
          <Recenter lat={lat} lng={lng} />
          {hasPos && <Marker position={[lat as number, lng as number]} icon={pinIcon} />}
        </MapContainer>
      </div>
    </div>
  );
}
