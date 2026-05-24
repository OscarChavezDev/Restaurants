'use client';

import { useState } from 'react';
import { Search, MapPin, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useSearchRestaurants } from '@/hooks/useRestaurants';
import { RestaurantCard, RestaurantCardSkeleton } from '@/features/restaurants/RestaurantCard';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { useTranslation } from '@/hooks/useTranslation';

export default function RestaurantsPublicPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(0);
  const t = useTranslation();

  const { data, isLoading } = useSearchRestaurants({
    name: search || undefined,
    city: city || undefined,
    page,
    size: 12,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-orange-200 mb-3 animate-slide-up">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Tingo María, Huánuco</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-6 animate-slide-up [animation-delay:100ms]">
            {t('restaurantsTitle')}
          </h1>

          <form onSubmit={handleSearch} className="flex gap-2 flex-col sm:flex-row animate-slide-up [animation-delay:200ms]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('cityPlaceholder')}
                className="w-full sm:w-44 pl-10 pr-4 py-3 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-orange-50 hover:scale-105 transition-all duration-200">
              {t('search')}
            </button>
          </form>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">{t('home')}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-900 font-medium">{t('restaurants')}</span>
          </div>
          {data && (
            <p className="text-sm text-gray-500">
              {data.totalElements} {t('restaurantsFound')}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
          </div>
        ) : data?.content.length === 0 ? (
          <div className="text-center py-24">
            <UtensilsCrossed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
              {t('noResults')}
            </h3>
            <p className="text-gray-500 mb-6">
              {search || city ? t('tryDifferent') : 'Aún no hay restaurantes registrados en la plataforma'}
            </p>
            {(search || city) && (
              <button
                onClick={() => { setSearch(''); setCity(''); setPage(0); }}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data?.content.map((restaurant, i) => (
                <AnimateOnScroll key={restaurant.id} animation="slide-up" delay={Math.min(i * 80, 400)} className="h-full">
                  <RestaurantCard restaurant={restaurant} />
                </AnimateOnScroll>
              ))}
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={data.first}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← {t('back')}
                </button>
                <span className="text-sm text-gray-600 px-4">
                  {data.page + 1} / {data.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={data.last}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  {t('search')} →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
