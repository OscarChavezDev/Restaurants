'use client';

import { useState } from 'react';
import { Search, MapPin, UtensilsCrossed, Navigation, X, ArrowLeft, Star, Clock, List, Map as MapIcon, Sparkles, Heart, CheckCircle } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { AuthNav } from '@/components/ui/AuthNav';
import { BrandMark } from '@/components/ui/BrandMark';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ThemeLangSwitch } from '@/components/ui/ThemeLangSwitch';

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
import { SelectMenu } from '@/components/ui/SelectMenu';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { EmptyState } from '@/components/ui/EmptyState';
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
  const [selectedMapId, setSelectedMapId] = useState<string | undefined>(undefined);
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
    
    // Función para manejar el éxito
    const handleSuccess = (lat: number, lon: number) => {
      setGeo({ status: 'ready', lat, lon });
      setSearch('');
      setCity('');
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => handleSuccess(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.warn("Geolocation failed:", err);
        // Si estamos en desarrollo o falla la ubicación real, ofrecemos simular Tingo María para que el usuario pueda probar
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
          console.log("Simulando ubicación en Tingo María para pruebas...");
          handleSuccess(-9.297, -75.998); // Coordenadas céntricas de Tingo María
        } else {
          setGeo({ status: 'error', message: 'No se pudo obtener tu ubicación. Verifica los permisos del navegador.' });
        }
      },
      { timeout: 5000 }
    );
  };

  const clearNearby = () => setGeo({ status: 'idle' });

  // Toggle: si ya estaba seleccionado, un segundo clic lo desmarca en vez de dejarlo pegado.
  const toggleMapSelection = (id: string) => setSelectedMapId((prev) => (prev === id ? undefined : id));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0908] relative">
      {/* Subtle Premium Background Glow */}
      <div className="absolute top-0 left-0 right-0 h-[30rem] bg-gradient-to-b from-orange-500/10 dark:from-orange-500/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Top Navbar & Title - Static (No sticky) */}
      <div className="pt-6 pb-2 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-x-4 gap-y-3 flex-wrap mb-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 transition-colors mr-1 sm:mr-2 shadow-sm">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="p-2 bg-white dark:bg-white/5 backdrop-blur-md shadow-sm border border-orange-100 dark:border-white/10 rounded-xl group-hover:scale-105 transition-transform">
                  <BrandMark className="h-6 w-6" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                  Resto<span className="text-orange-600 dark:text-orange-500">Point</span>
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium text-sm ml-4 border-l border-gray-200 dark:border-gray-800 pl-4">
                <MapPin className="h-4 w-4" />
                Tingo María, Huánuco
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeLangSwitch />
              <AuthNav />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 py-2">
            {/* Left side: Title, Integrated Search Console, Sleek Filter Ribbon */}
            <div className="flex-1 flex flex-col gap-5 lg:max-w-[56%]">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
                  {t('restaurantsTitle')}
                </h1>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Explora la mejor gastronomía en Tingo María, aprovecha ofertas exclusivas y reserva tu mesa al instante.
                </p>
              </div>
              
              {/* Integrated Hero Search Console */}
              <form onSubmit={handleSearch} className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-md transition-all focus-within:ring-2 focus-within:ring-orange-500/30 focus-within:border-orange-500/50 w-full">
                <div className="relative flex-1 flex items-center pl-3" data-tour="search">
                  <Search className="h-5 w-5 text-orange-500 flex-shrink-0 mr-2.5" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setGeo({ status: 'idle' }); }}
                    placeholder={t('searchPlaceholder')}
                    className="w-full bg-transparent border-none py-1.5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm rounded-xl hover:from-orange-600 hover:to-orange-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-orange-500/20 flex-shrink-0"
                >
                  {t('search')}
                </button>
              </form>

              {/* Compact Filter Ribbon */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <SelectMenu
                  value={priceRange}
                  onChange={(val) => { setPriceRange(val); setGeo({ status: 'idle' }); setPage(0); }}
                  placeholder="Precio: Todos"
                  options={[
                    { value: '', label: 'Precio: Todos' },
                    { value: 'LOW', label: 'Económico ($)' },
                    { value: 'MEDIUM', label: 'Moderado ($$)' },
                    { value: 'HIGH', label: 'Exclusivo ($$$)' }
                  ]}
                  className={cn(
                    'w-auto rounded-full py-1.5 px-3 text-xs font-semibold border transition-all focus:ring-0 min-w-[125px]',
                    priceRange 
                      ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400'
                      : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'
                  )}
                />

                <button
                  type="button"
                  data-tour="filter-categories"
                  onClick={() => setCategoryModalOpen(true)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-sm',
                    selectedCategories.length > 0
                      ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400'
                      : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <Sparkles className={cn('h-3.5 w-3.5', selectedCategories.length > 0 ? 'text-orange-500' : 'text-gray-400')} />
                  ¿Qué te apetece?
                  {selectedCategories.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                      {selectedCategories.length}
                    </span>
                  )}
                </button>

                {!isNearbyMode ? (
                  <button
                    type="button"
                    data-tour="filter-nearby"
                    onClick={handleNearby}
                    disabled={geo.status === 'loading'}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-60 transition-all shadow-sm"
                  >
                    {geo.status === 'loading' ? (
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                    ) : (
                      <Navigation className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    {geo.status === 'loading' ? 'Ubicando...' : t('nearby')}
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/80 p-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 text-xs font-bold shadow-2xs">
                      <Navigation className="h-3 w-3 fill-blue-500 text-blue-500" />
                      Cerca
                      <button onClick={clearNearby} className="ml-1 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {[5, 10].map((km) => (
                      <button
                        key={km}
                        type="button"
                        onClick={() => setRadiusKm(km)}
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors',
                          radiusKm === km ? 'bg-blue-500 text-white shadow-2xs' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        )}
                      >
                        {km}km
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setTopRatedFilter(!topRatedFilter)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-sm",
                    topRatedFilter
                      ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400"
                      : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <Star className={cn("h-3.5 w-3.5", topRatedFilter ? "fill-orange-500 text-orange-500" : "text-gray-400")} />
                  Mejores reseñas
                </button>

                <button
                  type="button"
                  onClick={() => setOpenNowFilter(!openNowFilter)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-sm",
                    openNowFilter
                      ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400"
                      : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <Clock className={cn("h-3.5 w-3.5", openNowFilter ? "text-orange-500" : "text-gray-400")} />
                  Abierto ahora
                </button>

                <button
                  type="button"
                  onClick={() => { setAvailableNowFilter(!availableNowFilter); setGeo({ status: 'idle' }); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-sm",
                    availableNowFilter
                      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400"
                      : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <CheckCircle className={cn("h-3.5 w-3.5", availableNowFilter ? "text-green-500" : "text-gray-400")} />
                  Mesas libres
                </button>

                {isAuthenticated && (
                  <button
                    type="button"
                    data-tour="filter-favorites"
                    onClick={() => setFavoritesOnly(!favoritesOnly)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-sm",
                      favoritesOnly
                        ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400"
                        : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <Heart className={cn("h-3.5 w-3.5", favoritesOnly ? "fill-red-500 text-red-500" : "text-gray-400")} />
                    Favoritos
                  </button>
                )}
              </div>

              {geo.status === 'error' && (
                <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/50 w-fit mt-1">
                  {(geo as any).message}
                </p>
              )}
            </div>
            
            {/* Right side: Offers Carousel */}
            <div className="w-full lg:w-[42%] xl:w-[440px] flex-shrink-0">
              <OffersCarousel />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Encabezado de la lista */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {isNearbyMode ? 'Cerca de ti' : 'Explorar'}
            </span>
            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium">
              {restaurants.length} {t('restaurantsFound')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Lista / Mapa */}
            <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl" data-tour="view-toggle">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all', viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}
              >
                <List className="h-4 w-4" /> Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all', viewMode === 'map' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}
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
          <EmptyState
            icon={UtensilsCrossed}
            title={t('noResults')}
            description={
              isNearbyMode
                ? 'No hay restaurantes activos en un radio de 5 km de tu ubicación actual.'
                : 'No se encontraron restaurantes con los filtros aplicados.'
            }
            glowColor="orange"
            action={
              <>
                {isNearbyMode && (process.env.NODE_ENV === 'development' || typeof window !== 'undefined' && window.location.hostname === 'localhost') && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setGeo({ status: 'ready', lat: -9.297, lon: -75.998 });
                      }}
                      className="px-6 py-2.5 bg-orange-100 text-orange-700 rounded-xl font-medium hover:bg-orange-200 transition-colors"
                    >
                      Simular ubicación en Tingo María (Dev Mode)
                    </button>
                  </div>
                )}
                
                {(search || city || isNearbyMode || topRatedFilter || openNowFilter || selectedCategories.length > 0 || priceRange || favoritesOnly) && (
                  <button
                    onClick={() => { setSearch(''); setCity(''); setPage(0); clearNearby(); setTopRatedFilter(false); setOpenNowFilter(false); setSelectedCategories([]); setPriceRange(''); setFavoritesOnly(false); }}
                    className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    {t('clearFilters')}
                  </button>
                )}
              </>
            }
          />
        ) : viewMode === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
            {/* Lista lateral sincronizada con el mapa */}
            <div className="order-2 lg:order-1 max-h-[280px] sm:max-h-[360px] lg:max-h-[600px] overflow-y-auto pr-1 space-y-3">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleMapSelection(r.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all',
                    selectedMapId === r.id
                      ? 'border-orange-400 bg-orange-50/70 dark:bg-orange-500/10 shadow-sm'
                      : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
                  )}
                >
                  <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-orange-200 to-rose-200 dark:from-orange-900/50 dark:to-rose-900/50 flex items-center justify-center">
                    {r.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.coverImageUrl} alt={r.name} className="h-full w-full object-cover" />
                    ) : (
                      <UtensilsCrossed className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{r.name}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                      <span className="font-medium">{r.avgRating?.toFixed(1) ?? '0.0'}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="truncate">{r.district || r.city}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="order-1 lg:order-2">
              <RestaurantsMap restaurants={restaurants} selectedId={selectedMapId} onSelect={toggleMapSelection} />
            </div>
          </div>
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
                <span className="text-sm text-gray-600 px-4 font-medium">
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
