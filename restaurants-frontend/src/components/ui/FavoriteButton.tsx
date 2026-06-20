'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function FavoriteButton({ restaurantId, className }: { restaurantId: string; className?: string }) {
  const { isFavorite, toggle, isAuthenticated } = useFavorites();
  const fav = isFavorite(restaurantId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // El "me gusta" requiere cuenta de cliente: si no hay sesión, avisamos.
    if (!isAuthenticated) {
      toast('Es necesario iniciar sesión para poder agregar como favorito');
      return;
    }
    toggle.mutate(restaurantId);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={cn(
        'inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:scale-110 active:scale-90 transition-transform',
        className
      )}
    >
      <Heart className={cn('h-4 w-4 transition-colors', fav ? 'fill-red-500 text-red-500' : 'text-gray-500')} />
    </button>
  );
}
