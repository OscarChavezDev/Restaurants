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

  const move = (idx: number, dir: number) => {
    if (!images) return;
    const arr = [...images];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    reorder.mutate(arr.map((img, k) => ({ id: img.id, displayOrder: k })));
  };

  const makeCover = (idx: number) => {
    if (!images || idx === 0) return;
    const arr = [...images];
    const [picked] = arr.splice(idx, 1);
    arr.unshift(picked);
    reorder.mutate(arr.map((img, k) => ({ id: img.id, displayOrder: k })));
    toast.success('Portada actualizada');
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm p-6 sm:p-8 h-full transition-colors hover:border-gray-200 dark:hover:border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <ImageIcon className="h-5 w-5" />
          </span>
          Galería de fotos
        </h2>
        {images && images.length > 0 && (
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-neutral-800 px-3 py-1.5 rounded-full">{images.length} fotos</span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">La primera foto se usa como portada del restaurante.</p>

      {/* Upload zone — compact */}
      <div className="mb-4">
        <ImageUploader
          folder={restaurantId}
          onUploaded={(url) => add.mutate(url)}
          label="Subir foto"
          compact
        />
      </div>

      {/* Photo grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">{[1, 2, 3].map((i) => <div key={i} className="aspect-video skeleton rounded-lg" />)}</div>
      ) : !images?.length ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Sin fotos aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, idx) => (
            <div key={img.id} className={`relative group rounded-lg overflow-hidden ${idx === 0 ? 'ring-2 ring-orange-400 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption ?? 'Foto del restaurante'}
                className="w-full aspect-video object-cover bg-gray-100 dark:bg-neutral-800"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" font-size="10" fill="%239ca3af" text-anchor="middle" dy=".3em">URL inválida</text></svg>'; }}
              />
              
              {/* Label */}
              <span className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-orange-500 text-white' : 'bg-black/60 text-white/80'}`}>
                {idx === 0 ? 'Portada' : `#${idx + 1}`}
              </span>
              
              {/* Delete button */}
              <button
                onClick={() => remove.mutate(img.id)}
                disabled={remove.isPending}
                title="Eliminar"
                className="absolute top-1 right-1 p-1 bg-white/90 dark:bg-neutral-800/90 hover:bg-red-500 hover:text-white text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>

              {/* Reorder + cover controls */}
              <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-0.5">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0 || reorder.isPending} title="Mover antes"
                    className="p-0.5 bg-white/90 dark:bg-neutral-800/90 hover:bg-orange-500 hover:text-white text-gray-700 dark:text-gray-300 rounded disabled:opacity-30 disabled:hover:bg-white/90 disabled:hover:text-gray-700">
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <button onClick={() => move(idx, 1)} disabled={idx === images.length - 1 || reorder.isPending} title="Mover después"
                    className="p-0.5 bg-white/90 dark:bg-neutral-800/90 hover:bg-orange-500 hover:text-white text-gray-700 dark:text-gray-300 rounded disabled:opacity-30 disabled:hover:bg-white/90 disabled:hover:text-gray-700">
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                {idx !== 0 && (
                  <button onClick={() => makeCover(idx)} disabled={reorder.isPending} title="Usar como portada"
                    className="p-0.5 bg-white/90 dark:bg-neutral-800/90 hover:bg-orange-500 hover:text-white text-orange-600 rounded">
                    <Star className="h-3 w-3" />
                  </button>
                )}
              </div>

              {img.caption && (
                <p className="absolute bottom-0 inset-x-0 text-[10px] text-white bg-gradient-to-t from-black/70 to-transparent px-1.5 py-0.5 truncate">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
