'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Trash2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { ImageUploader } from '@/components/ui/ImageUploader';
import toast from 'react-hot-toast';

export function PhotoManager({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const { data: images, isLoading } = useQuery({
    queryKey: ['images', restaurantId],
    queryFn: () => restaurantService.getImages(restaurantId),
    enabled: !!restaurantId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['images', restaurantId] });
    qc.invalidateQueries({ queryKey: ['restaurants', 'detail', restaurantId] });
  };

  const add = useMutation({
    mutationFn: (url: string) => restaurantService.addImage(restaurantId, { url }),
    onSuccess: () => { invalidate(); toast.success('Foto agregada'); },
    onError: () => toast.error('No se pudo agregar la foto'),
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => restaurantService.deleteImage(restaurantId, imageId),
    onSuccess: () => { invalidate(); toast.success('Foto eliminada'); },
    onError: () => toast.error('No se pudo eliminar la foto'),
  });

  const reorder = useMutation({
    mutationFn: (items: { id: string; displayOrder: number }[]) => restaurantService.reorderImages(restaurantId, items),
    onSuccess: () => invalidate(),
    onError: () => toast.error('No se pudo reordenar'),
  });

  // Mueve una foto (dir = -1 izquierda, +1 derecha) y reasigna el orden 0..n.
  const move = (idx: number, dir: number) => {
    if (!images) return;
    const arr = [...images];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    reorder.mutate(arr.map((img, k) => ({ id: img.id, displayOrder: k })));
  };

  // Pone una foto como portada (posición 0).
  const makeCover = (idx: number) => {
    if (!images || idx === 0) return;
    const arr = [...images];
    const [picked] = arr.splice(idx, 1);
    arr.unshift(picked);
    reorder.mutate(arr.map((img, k) => ({ id: img.id, displayOrder: k })));
    toast.success('Portada actualizada');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-display text-base font-semibold text-gray-900 flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-orange-500" /> Galería de fotos
      </h2>
      <p className="text-xs text-gray-400 mb-4 mt-1">La primera foto (Portada) se usa como imagen principal del restaurante.</p>

      {/* Subir foto (Cloudinary) */}
      <div className="mb-5">
        <ImageUploader
          folder={restaurantId}
          onUploaded={(url) => add.mutate(url)}
          label="Subir foto del restaurante"
        />
      </div>

      {/* Grilla de fotos */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[1, 2, 3].map((i) => <div key={i} className="aspect-video skeleton rounded-xl" />)}</div>
      ) : !images?.length ? (
        <div className="text-center py-10 text-gray-400">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin fotos aún. Sube la primera con el botón de arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, idx) => (
            <div key={img.id} className={`relative group rounded-xl overflow-hidden border ${idx === 0 ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-100'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption ?? 'Foto del restaurante'}
                className="w-full aspect-video object-cover bg-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" font-size="10" fill="%239ca3af" text-anchor="middle" dy=".3em">URL inválida</text></svg>'; }}
              />
              <span className={`absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-orange-500 text-white' : 'bg-black/60 text-white'}`}>{idx === 0 ? 'Portada' : `#${idx + 1}`}</span>
              <button
                onClick={() => remove.mutate(img.id)}
                disabled={remove.isPending}
                title="Eliminar foto"
                className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {/* Controles de orden */}
              <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0 || reorder.isPending} title="Mover antes"
                    className="p-1 bg-white/90 hover:bg-orange-500 hover:text-white text-gray-700 rounded-md disabled:opacity-30 disabled:hover:bg-white/90 disabled:hover:text-gray-700">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(idx, 1)} disabled={idx === images.length - 1 || reorder.isPending} title="Mover después"
                    className="p-1 bg-white/90 hover:bg-orange-500 hover:text-white text-gray-700 rounded-md disabled:opacity-30 disabled:hover:bg-white/90 disabled:hover:text-gray-700">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {idx !== 0 && (
                  <button onClick={() => makeCover(idx)} disabled={reorder.isPending} title="Usar como portada"
                    className="p-1 bg-white/90 hover:bg-orange-500 hover:text-white text-orange-600 rounded-md">
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {img.caption && (
                <p className="absolute bottom-0 inset-x-0 text-[11px] text-white bg-gradient-to-t from-black/70 to-transparent px-2 py-1 truncate">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
