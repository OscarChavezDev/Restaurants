'use client';

import { useState } from 'react';
import { Search, MapPin, List, Map as MapIcon, UtensilsCrossed, Sparkles, Navigation, Star, Clock, CheckCircle, Heart, X } from 'lucide-react';
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
import { RatingModal } from '@/components/ui/RatingModal';
import { useRatings } from '@/hooks/useRatings';
import toast from 'react-hot-toast';

const RestaurantsMap = dynamic(() => import('@/components/ui/RestaurantsMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] rounded-2xl bg-gray-100 animate-pulse" />,
});

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lat: number; lon: number }
  | { status: 'error'; message: string };

export default function ProfileRestaurantsPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const [topRatedFilter, setTopRatedFilter] = useState(false);
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [availableNowFilter, setAvailableNowFilter] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [priceRange, setPriceRange] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);

  const { ids: favoriteIds } = useFavorites();
  const { createRating, loading: ratingLoading } = useRatings();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRestaurantId, setReviewRestaurantId] = useState('');

  const t = useTranslation();

  const { data: availableNowIds } = useQuery({
    queryKey: ['available-now'],
    queryFn: () => restaurantService.getAvailableNow(),
    enabled: availableNowFilter,
    staleTime: 1000 * 60,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => restaurantService.getCategories(),
    staleTime: 1000 * 60 * 30,
  });

  const isNearbyMode = geo.status === 'ready';

  const { data: searchData, isLoading: searchLoading } = useSearchRestaurants({
    name: search || undefined,
    city: city || undefined,
    priceRange: priceRange || undefined,
    page,
    size: 100,
  });

  const { data: nearbyData, isLoading: nearbyLoading } = useNearbyRestaurants(
    isNearbyMode ? (geo as any).lat : 0,
    isNearbyMode ? (geo as any).lon : 0,
    radiusKm
  );

  const isLoading = isNearbyMode ? nearbyLoading : searchLoading;
  let restaurants = isNearbyMode ? nearbyData ?? [] : searchData?.content ?? [];

  const isRestaurantOpenNow = (schedules: any[]): boolean => {
    if (!schedules || schedules.length === 0) return false;
    const now = new Date();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayStr = days[now.getDay()];
    const todaySchedule = schedules.find((s: any) => s.dayOfWeek === todayStr);
    if (!todaySchedule || todaySchedule.isClosed) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const parseTime = (timeStr: string) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    const openTime = parseTime(todaySchedule.openingTime);
    const closeTime = parseTime(todaySchedule.closingTime);
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  restaurants = restaurants.filter(r => {
    if (openNowFilter && !isRestaurantOpenNow(r.schedules)) return false;
    if (selectedCategories.length > 0 && !(r.categoryIds ?? []).some(id => selectedCategories.includes(id))) return false;
    if (favoritesOnly && !favoriteIds.has(r.id)) return false;
    if (availableNowFilter && !(availableNowIds ?? []).includes(r.id)) return false;
    return true;
  });

  if (topRatedFilter) {
    restaurants.sort((a, b) => b.avgRating - a.avgRating);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setGeo({ status: 'idle' });
    setPage(0);
  };

  const handleNearby = () => {
    if (!navigator.geolocation) {
      setGeo({ status: 'error', message: 'Tu navegador no soporta geolocalización' });
      return;
    }
    setGeo({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ status: 'ready', lat: pos.coords.latitude, lon: pos.coords.longitude });
        setSearch('');
        setCity('');
      },
      () => setGeo({ status: 'error', message: 'No se pudo obtener tu ubicación. Verifica los permisos del navegador.' })
    );
  };

  const clearNearby = () => setGeo({ status: 'idle' });

  const handleOpenReview = (restaurantId: string) => {
    setReviewRestaurantId(restaurantId);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (data: any) => {
    try {
      await createRating({
        restaurantId: reviewRestaurantId,
        ...data
      });
      toast.success('Reseña publicada exitosamente');
      setReviewModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al publicar reseña');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Explorar Restaurantes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Encuentra tu próximo lugar favorito para comer</p>
      </div>

      {/* Controles y Búsqueda */}
      <div className="bg-white dark:bg-[#15120E] p-5 rounded-2xl border border-gray-100 dark:border-[#352D25] shadow-sm flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-col xl:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setGeo({ status: 'idle' }); }}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-[#2C251E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={city}
              onChange={(e) => { setCity(e.target.value); setGeo({ status: 'idle' }); }}
              placeholder={t('cityPlaceholder')}
              className="w-full xl:w-44 pl-10 pr-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-[#2C251E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
            Buscar
          </button>
        </form>

        {/* Filtros Avanzados */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Categorías */}
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border',
              selectedCategories.length > 0
                ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-[#15120E] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#2C251E]'
            )}
          >
            <Sparkles className="h-4 w-4" />
            Categorías
            {selectedCategories.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                {selectedCategories.length}
              </span>
            )}
          </button>

          {/* Cerca de mí */}
          {!isNearbyMode ? (
            <button
              type="button"
              onClick={handleNearby}
              disabled={geo.status === 'loading'}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors dark:bg-[#15120E] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#2C251E]"
            >
              {geo.status === 'loading' ? (
                <span className="h-4 w-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              {geo.status === 'loading' ? 'Ubicando...' : t('nearby')}
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 text-sm font-semibold dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400">
                <Navigation className="h-4 w-4 fill-orange-500 dark:fill-orange-400" />
                Cerca de mí
                <button onClick={clearNearby} className="ml-1 hover:text-orange-800 dark:hover:text-orange-300 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-[#44403C] overflow-hidden text-sm font-medium">
                {[5, 10].map((km) => (
                  <button
                    key={km}
                    onClick={() => setRadiusKm(km)}
                    className={cn(
                      'px-3 py-2 transition-colors',
                      radiusKm === km ? 'bg-gray-100 text-gray-900 dark:bg-[#2C251E] dark:text-white' : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-[#15120E] dark:text-[#A8A29E] dark:hover:bg-[#2C251E]'
                    )}
                  >
                    {km}km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Switches */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setTopRatedFilter(!topRatedFilter)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border", topRatedFilter ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-[#15120E] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#2C251E]")}
            >
              <Star className={cn("h-4 w-4", topRatedFilter && "fill-orange-500 text-orange-500 dark:fill-orange-400 dark:text-orange-400")} /> Mejores
            </button>
            <button
              onClick={() => setOpenNowFilter(!openNowFilter)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border", openNowFilter ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-[#15120E] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#2C251E]")}
            >
              <Clock className="h-4 w-4" /> Abierto
            </button>
            <button
              onClick={() => { setAvailableNowFilter(!availableNowFilter); setGeo({ status: 'idle' }); }}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border", availableNowFilter ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-[#15120E] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#2C251E]")}
            >
              <CheckCircle className={cn("h-4 w-4", availableNowFilter && "text-green-500")} /> Con mesas
            </button>
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border", favoritesOnly ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-[#15120E] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#2C251E]")}
            >
              <Heart className={cn("h-4 w-4", favoritesOnly && "fill-red-500 text-red-500")} /> Favoritos
            </button>
          </div>

          <span className="hidden lg:block h-6 w-px bg-gray-200 dark:bg-[#44403C] mx-1" />

          {/* Precio */}
          <div className="flex items-center rounded-xl border border-gray-200 dark:border-[#44403C] overflow-hidden text-sm font-medium">
            {[['LOW', '$', 'Económico'], ['MEDIUM', '$$', 'Medio'], ['HIGH', '$$$', 'Alto']].map(([val, sym, label]) => (
              <button
                key={val}
                title={label}
                onClick={() => { setPriceRange(priceRange === val ? '' : val); setGeo({ status: 'idle' }); setPage(0); }}
                className={cn(
                  'px-3 py-2 transition-colors',
                  priceRange === val ? 'bg-gray-100 text-orange-600 dark:bg-[#2C251E] dark:text-orange-400' : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-[#15120E] dark:text-[#A8A29E] dark:hover:bg-[#2C251E]'
                )}
              >
                {sym}
              </button>
            ))}
          </div>

        </div>

        {geo.status === 'error' && (
          <p className="text-red-600 dark:text-red-400 text-xs mt-1">
            {(geo as any).message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {restaurants.length} resultados encontrados
        </p>
        <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-[#44403C] overflow-hidden text-sm font-medium">
          <button
            onClick={() => setViewMode('list')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 transition-colors', viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-[#15120E] text-gray-600 dark:text-[#A8A29E] hover:bg-gray-50 dark:hover:bg-[#2C251E]')}
          >
            <List className="h-4 w-4" /> Lista
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 transition-colors', viewMode === 'map' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-[#15120E] text-gray-600 dark:text-[#A8A29E] hover:bg-gray-50 dark:hover:bg-[#2C251E]')}
          >
            <MapIcon className="h-4 w-4" /> Mapa
          </button>
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
            Intenta cambiar los filtros o limpiar la búsqueda.
          </p>
          <button
            onClick={() => { setSearch(''); setCity(''); setPage(0); clearNearby(); setTopRatedFilter(false); setOpenNowFilter(false); setSelectedCategories([]); setPriceRange(''); setFavoritesOnly(false); setAvailableNowFilter(false); }}
            className="mt-4 px-6 py-2.5 bg-gray-100 dark:bg-[#2C251E] text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#352D25] transition-colors"
          >
            Limpiar filtros
          </button>
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
                <RestaurantCard 
                  restaurant={restaurant} 
                  showDistance={isNearbyMode}
                  onReview={handleOpenReview}
                />
              </AnimateOnScroll>
            ))}
          </div>

          {!isNearbyMode && searchData && searchData.totalPages > 1 && (
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
        onClose={() => { setCategoryModalOpen(false); setGeo({ status: 'idle' }); setPage(0); }}
        categories={categories ?? []}
        selected={selectedCategories}
        onToggle={(id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        onClear={() => setSelectedCategories([])}
        resultsCount={restaurants.length}
      />

      {/* Review Modal for Direct Reviews */}
      <RatingModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        loading={ratingLoading}
      />
    </div>
  );
}
