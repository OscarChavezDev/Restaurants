'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { useRestaurantImages } from '@/hooks/useRestaurants';

function Lightbox({ images, index, onClose }: {
  images: { url: string; caption?: string }[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      <div
        className="relative max-w-4xl max-h-[85vh] w-full mx-16"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative w-full" style={{ paddingBottom: '60%' }}>
          <Image
            src={images[current].url}
            alt={images[current].caption ?? ''}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
        {images[current].caption && (
          <p className="text-center text-white/70 text-sm mt-2">{images[current].caption}</p>
        )}
        {images.length > 1 && (
          <p className="text-center text-white/40 text-xs mt-1">{current + 1} / {images.length}</p>
        )}
      </div>
    </div>
  );
}

export function ImageGallery({ restaurantId }: { restaurantId: string }) {
  const { data: images } = useRestaurantImages(restaurantId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
          <Images className="h-5 w-5 text-orange-500" /> Galería
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.slice(0, 6).map((img, i) => (
            <button
              key={img.id}
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity group"
            >
              <Image
                src={img.url}
                alt={img.caption ?? `Foto ${i + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              {i === 5 && images.length > 6 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">+{images.length - 6}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
