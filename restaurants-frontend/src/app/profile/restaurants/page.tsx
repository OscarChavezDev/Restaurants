'use client';

import { useState } from 'react';
import { Search, MapPin, List, Map as MapIcon, UtensilsCrossed, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchRestaurants, useNearbyRestaurants } from '@/hooks/useRestaurants';
import { restaurantService } from '@/services/restaurantService';
import { useQuery } from '@tanstack/react-query';
import { useFavorites } from '@/hooks/useFavorites';
import { RestaurantCard, RestaurantCardSkeleton } from '@/features/restaurants/RestaurantCard';
import { CategoryModal } from '@/components/ui/CategoryModal';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/utils/cn';

const RestaurantsMap = dynamic(() => import('@/components/ui/RestaurantsMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] rounded-2xl bg-gray-100 animate-pulse" />,
});

export default function ProfileRestaurantsPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const t = useTranslation();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => restaurantService.getCategories(),
    staleTime: 1000 * 60 * 30,
  });

  const { data: searchData, isLoading } = useSearchRestaurants({
    name: search || undefined,
    city: city || undefined,
    page,
    size: 20,
  });

  let restaurants = searchData?.content ?? [];

  if (selectedCategories.length > 0) {
    restaurants = restaurants.filter(r => 
      (r.categoryIds ?? []).some(id => selectedCategories.includes(id))
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Explorar Restaurantes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Encuentra tu próximo lugar favorito para comer</p>
        </div>

        {/* Búsqueda */}
        <div className="bg-white dark:bg-[#15120E] p-4 rounded-2xl border border-gray-100 dark:border-[#352D25] shadow-sm flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-[#2C251E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('cityPlaceholder')}
                className="w-full sm:w-44 pl-10 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-[#2C251E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors">
              Buscar
            </button>
          </form>

          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border',
              selectedCategories.length > 0
                ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-[#F97A3D]/10 dark:text-[#F97A3D] dark:border-[#F97A3D]/20'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-[#15120E] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#2C251E]'
            )}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Categorías</span>
            {selectedCategories.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold">
                {selectedCategories.length}
              </span>
            )}
          </button>
        </div>
        
        {/* Toggle View */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {restaurants.length} resultados
          </p>
          <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-[#44403C] overflow-hidden text-sm font-medium">
            <button
              onClick={() => setViewMode('list')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 transition-colors', viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-[#15120E] text-gray-600 dark:text-[#A8A29E]')}
            >
              <List className="h-4 w-4" /> Lista
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 transition-colors', viewMode === 'map' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-[#15120E] text-gray-600 dark:text-[#A8A29E]')}
            >
              <MapIcon className="h-4 w-4" /> Mapa
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-[#15120E] rounded-2xl border border-gray-100 dark:border-[#352D25]">
          <UtensilsCrossed className="h-16 w-16 text-gray-300 dark:text-[#44403C] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No se encontraron restaurantes
          </h3>
          <p className="text-gray-500 dark:text-[#A8A29E]">
            Intenta cambiar los filtros o los términos de búsqueda.
          </p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="flex-1 min-h-[500px] rounded-2xl overflow-hidden border border-gray-200 dark:border-[#44403C]">
          <RestaurantsMap restaurants={restaurants} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurants.map((restaurant, i) => (
              <AnimateOnScroll key={restaurant.id} animation="slide-up" delay={Math.min(i * 50, 200)} className="h-full">
                <RestaurantCard restaurant={restaurant} />
              </AnimateOnScroll>
            ))}
          </div>

          {searchData && searchData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pb-4">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={searchData.first}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#44403C] text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#2C251E] transition-colors dark:text-white"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-600 dark:text-[#A8A29E] px-4">
                {searchData.page + 1} / {searchData.totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={searchData.last}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#44403C] text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-[#2C251E] transition-colors dark:text-white"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories ?? []}
        selected={selectedCategories}
        onToggle={(id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        onClear={() => setSelectedCategories([])}
        resultsCount={restaurants.length}
      />
    </div>
  );
}
