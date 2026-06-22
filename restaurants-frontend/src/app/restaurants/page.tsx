'use client';

import { useState } from 'react';
import { Search, MapPin, UtensilsCrossed, Navigation, X, ArrowLeft, Star, Clock, List, Map as MapIcon, Sparkles, Heart, CheckCircle } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { AuthNav } from '@/components/ui/AuthNav';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RestaurantsMap = dynamic(() => import('@/components/ui/RestaurantsMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] rounded-2xl bg-gray-100 animate-pulse" />,
});
import { useQuery } from '@tanstack/react-query';
import { useSearchRestaurants, useNearbyRestaurants } from '@/hooks/useRestaurants';
import { restaurantService } from '@/services/restaurantService';
import { RestaurantCard, RestaurantCardSkeleton } from '@/features/restaurants/RestaurantCard';
import { OffersCarousel } from '@/components/ui/OffersCarousel';
import { CategoryModal } from '@/components/ui/CategoryModal';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/utils/cn';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lat: number; lon: number }
  | { status: 'error'; message: string };

export default function RestaurantsPublicPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(0);
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const [topRatedFilter, setTopRatedFilter] = useState(false);
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [priceRange, setPriceRange] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [availableNowFilter, setAvailableNowFilter] = useState(false);
  const { ids: favoriteIds, isAuthenticated } = useFavorites();

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

  const t = useTranslation();

  const isNearbyMode = geo.status === 'ready';

  const { data: searchData, isLoading: searchLoading } = useSearchRestaurants({
    name: search || undefined,
    city: city || undefined,
    priceRange: priceRange || undefined,
    page,
    size: 100, // Increased size to make client-side filtering more effective
  });

  const { data: nearbyData, isLoading: nearbyLoading } = useNearbyRestaurants(
    isNearbyMode ? (geo as any).lat : 0,
    isNearbyMode ? (geo as any).lon : 0,
    radiusKm
  );

  const isLoading = isNearbyMode ? nearbyLoading : searchLoading;
  let restaurants = isNearbyMode ? nearbyData ?? [] : searchData?.content ?? [];
  const totalElements = isNearbyMode ? nearbyData?.length : searchData?.totalElements;

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

  // Client-side filtering and sorting
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 dark:from-[#3E1408] dark:to-[#7C2D12] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 mb-5">
            <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium shadow-sm animate-slide-up bg-white text-orange-600 hover:bg-orange-50 border border-white/50 dark:bg-white/10 dark:text-white dark:border-white/20 dark:backdrop-blur-md dark:hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Link>
            <AuthNav />
          </div>
          <div className="flex items-center gap-2 text-orange-200 mb-3 animate-slide-up">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Tingo María, Huánuco</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-6 animate-slide-up [animation-delay:100ms]">
            {t('restaurantsTitle')}
          </h1>

          <div className="flex flex-col gap-3 animate-slide-up [animation-delay:200ms]">
            <form onSubmit={handleSearch} className="flex gap-2 flex-col sm:flex-row">
              <div className="relative flex-1" data-tour="search">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setGeo({ status: 'idle' }); }}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setGeo({ status: 'idle' }); }}
                  placeholder={t('cityPlaceholder')}
                  className="w-full sm:w-44 pl-10 pr-4 py-3 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-[#ffffff] text-[#C2410C] dark:bg-orange-500 dark:text-white font-semibold rounded-xl hover:bg-orange-50 dark:hover:bg-orange-600 hover:scale-105 transition-all duration-200 shadow-sm">
                {t('search')}
              </button>
            </form>

            {/* Filtros — organizados en dos grupos: Descubrir y Filtrar */}
            <div className="flex flex-col gap-3 mt-2">

              {/* Grupo 1 · Descubrir: tipo de comida + cerca de mí */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-tour="filter-categories"
                  onClick={() => setCategoryModalOpen(true)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border hover:scale-105 active:scale-95',
                    selectedCategories.length > 0
                      ? 'bg-white text-orange-600 border-transparent shadow-sm'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm'
                  )}
                >
                  <Sparkles className={cn('h-4 w-4 transition-transform group-hover:rotate-12', selectedCategories.length > 0 ? 'text-orange-500' : 'text-white')} />
                  ¿Qué te apetece?
                  {selectedCategories.length > 0 && (
                    <span key={selectedCategories.length} className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold animate-pop">
                      {selectedCategories.length}
                    </span>
                  )}
                </button>

                {/* Botón Cerca de mí */}
                {!isNearbyMode ? (
                  <button
                    type="button"
                    data-tour="filter-nearby"
                    onClick={handleNearby}
                    disabled={geo.status === 'loading'}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 border border-white/30 text-white text-sm font-medium hover:bg-white/25 disabled:opacity-60 transition-all duration-200"
                  >
                    {geo.status === 'loading' ? (
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    {geo.status === 'loading' ? 'Obteniendo ubicación...' : t('nearby')}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-orange-600 text-sm font-semibold shadow-sm">
                      <Navigation className="h-4 w-4 fill-orange-500" />
                      {t('showingNearby')}
                      <button onClick={clearNearby} className="ml-1 hover:text-orange-800 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Selector de radio */}
                    <div className="inline-flex items-center rounded-xl bg-white/10 border border-white/25 backdrop-blur-sm overflow-hidden text-sm font-medium">
                      {[5, 10].map((km) => (
                        <button
                          key={km}
                          type="button"
                          onClick={() => setRadiusKm(km)}
                          className={cn(
                            'px-3.5 py-2.5 transition-colors',
                            radiusKm === km ? 'bg-white text-orange-600' : 'text-white hover:bg-white/20'
                          )}
                        >
                          {km} km
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Grupo 2 · Filtrar: estado/calidad + precio + favoritos (solo registrados) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTopRatedFilter(!topRatedFilter)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border hover:scale-105 active:scale-95",
                    topRatedFilter
                      ? "bg-white text-orange-600 border-transparent shadow-sm"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
                  )}
                >
                  <Star className={cn("h-4 w-4", topRatedFilter ? "fill-orange-500 text-orange-500" : "text-white")} />
                  Mejores reseñas
                </button>

                <button
                  type="button"
                  onClick={() => setOpenNowFilter(!openNowFilter)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border hover:scale-105 active:scale-95",
                    openNowFilter
                      ? "bg-white text-orange-600 border-transparent shadow-sm"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  Abierto ahora
                </button>

                <button
                  type="button"
                  onClick={() => { setAvailableNowFilter(!availableNowFilter); setGeo({ status: 'idle' }); }}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border hover:scale-105 active:scale-95",
                    availableNowFilter
                      ? "bg-white text-orange-600 border-transparent shadow-sm"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
                  )}
                >
                  <CheckCircle className={cn("h-4 w-4", availableNowFilter ? "text-green-500" : "text-white")} />
                  Con mesas libres
                </button>

                {/* Favoritos — solo visible para clientes registrados (login con Google) */}
                {isAuthenticated && (
                  <button
                    type="button"
                    data-tour="filter-favorites"
                    onClick={() => setFavoritesOnly(!favoritesOnly)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border hover:scale-105 active:scale-95",
                      favoritesOnly
                        ? "bg-white text-orange-600 border-transparent shadow-sm"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", favoritesOnly ? "fill-red-500 text-red-500" : "text-white")} />
                    Favoritos
                  </button>
                )}

                {/* Separador visual entre filtros y precio */}
                <span className="hidden sm:block h-7 w-px bg-white/25 mx-1" />

                {/* Filtro por precio */}
                <div className="flex flex-wrap items-center gap-2" data-tour="filter-price">
                  {([['LOW', '$', 'Económico', 'Menos de S/ 15'], ['MEDIUM', '$$', 'Medio', 'S/ 15 – 35'], ['HIGH', '$$$', 'Alto', 'Más de S/ 35']] as const).map(([val, sym, label, hint]) => (
                    <button
                      key={val}
                      type="button"
                      title={hint}
                      onClick={() => { setPriceRange(priceRange === val ? '' : val); setGeo({ status: 'idle' }); setPage(0); }}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border hover:scale-105 active:scale-95',
                        priceRange === val
                          ? 'bg-white text-orange-600 border-transparent shadow-sm'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm'
                      )}
                    >
                      <span className={cn('font-bold tabular-nums', priceRange === val ? 'text-orange-500' : 'text-white/80')}>{sym}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {geo.status === 'error' && (
                <p className="text-orange-100 text-xs bg-white/10 px-3 py-1.5 rounded-lg w-fit">
                  {(geo as any).message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Carrusel de ofertas (flyers con IA) de todos los restaurantes */}
        <OffersCarousel />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">{t('home')}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-900 font-medium">
              {isNearbyMode ? t('nearbyRestaurants') : t('restaurants')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">
              {restaurants.length} {t('restaurantsFound')}
            </p>
            {/* Toggle Lista / Mapa */}
            <div className="inline-flex items-center rounded-xl border border-gray-200 overflow-hidden text-sm font-medium" data-tour="view-toggle">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 transition-colors', viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
              >
                <List className="h-4 w-4" /> Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 transition-colors', viewMode === 'map' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}
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
          <div className="text-center py-24">
            <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
              {t('noResults')}
            </h3>
            <p className="text-gray-500 mb-6">
              {isNearbyMode
                ? 'No hay restaurantes activos en un radio de 5 km de tu ubicación'
                : 'No se encontraron restaurantes con los filtros aplicados'}
            </p>
            {(search || city || isNearbyMode || topRatedFilter || openNowFilter || selectedCategories.length > 0 || priceRange || favoritesOnly) && (
              <button
                onClick={() => { setSearch(''); setCity(''); setPage(0); clearNearby(); setTopRatedFilter(false); setOpenNowFilter(false); setSelectedCategories([]); setPriceRange(''); setFavoritesOnly(false); }}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>
        ) : viewMode === 'map' ? (
          <RestaurantsMap restaurants={restaurants} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-tour="results">
              {restaurants.map((restaurant, i) => (
                <AnimateOnScroll key={restaurant.id} animation="slide-up" delay={Math.min(i * 80, 400)} className="h-full">
                  <RestaurantCard restaurant={restaurant} />
                </AnimateOnScroll>
              ))}
            </div>

            {!isNearbyMode && searchData && searchData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={searchData.first}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← {t('back')}
                </button>
                <span className="text-sm text-gray-600 px-4">
                  {searchData.page + 1} / {searchData.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={searchData.last}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  {t('search')} →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de tipo de comida (multi-selección) */}
      <CategoryModal
        open={categoryModalOpen}
        onClose={() => { setCategoryModalOpen(false); setGeo({ status: 'idle' }); setPage(0); }}
        categories={categories ?? []}
        selected={selectedCategories}
        onToggle={(id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        onClear={() => setSelectedCategories([])}
        resultsCount={restaurants.length}
      />
    </div>
  );
}
