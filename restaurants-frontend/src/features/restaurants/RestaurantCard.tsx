'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Users, Wifi, Car, UtensilsCrossed, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { RestaurantLogo } from '@/components/ui/RestaurantLogo';
import { PromoBadge } from '@/features/restaurants/PromoBadge';
import { formatDistance, formatRating } from '@/utils/formatters';
import type { Restaurant } from '@/types/restaurant';

// Visually rich gradients — one is picked deterministically per restaurant
const GRADIENTS = [
  { bg: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', icon: '#fed7aa' },  // orange
  { bg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', icon: '#fde68a' },  // amber
  { bg: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)', icon: '#fecaca' },  // red
  { bg: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)', icon: '#a7f3d0' },  // emerald
  { bg: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', icon: '#bfdbfe' },  // blue
  { bg: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)', icon: '#ddd6fe' },  // violet
  { bg: 'linear-gradient(135deg, #ec4899 0%, #9d174d 100%)', icon: '#fbcfe8' },  // pink
  { bg: 'linear-gradient(135deg, #14b8a6 0%, #134e4a 100%)', icon: '#99f6e4' },  // teal
];

function pickGradient(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  ACTIVE:             { label: 'Activo',      icon: <CheckCircle className="h-3 w-3" />, cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  INACTIVE:           { label: 'Inactivo',    icon: <XCircle className="h-3 w-3" />,    cls: 'bg-gray-500/20 text-gray-300 border-gray-400/30' },
  TEMPORARILY_CLOSED: { label: 'Cerrado',     icon: <Clock className="h-3 w-3" />,      cls: 'bg-amber-500/20 text-amber-300 border-amber-400/30' },
  PENDING_APPROVAL:   { label: 'Pendiente',   icon: <Clock className="h-3 w-3" />,      cls: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
};

interface Props {
  restaurant: Restaurant;
  showDistance?: boolean;
}

export function RestaurantCard({ restaurant, showDistance }: Props) {
  const gradient = pickGradient(restaurant.id ?? restaurant.name);
  const status = STATUS_CONFIG[restaurant.status] ?? STATUS_CONFIG.INACTIVE;

  return (
    <Link href={`/restaurants/${restaurant.slug}`} className="group block h-full">
      <article className={cn(
        'rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl',
        'transition-all duration-300 h-full flex flex-col',
        'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700',
        'hover:-translate-y-1'
      )}>
        {/* Cover image / gradient placeholder */}
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          {restaurant.coverImageUrl ? (
            <Image
              src={restaurant.coverImageUrl}
              alt={restaurant.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
              style={{ background: gradient.bg }}
            >
              {/* subtle noise texture overlay */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")' }}
              />
              <UtensilsCrossed
                className="h-14 w-14 drop-shadow-lg"
                style={{ color: gradient.icon }}
              />
            </div>
          )}

          {/* Status badge — glassmorphic, works on any background */}
          <span className={cn(
            'absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1',
            'rounded-full text-xs font-semibold border backdrop-blur-sm',
            status.cls
          )}>
            {status.icon}
            {status.label}
          </span>

          {/* Distance badge */}
          {showDistance && restaurant.distanceKm !== undefined && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm border border-white/10">
              <MapPin className="h-3 w-3" />
              {formatDistance(restaurant.distanceKm)}
            </span>
          )}

          {/* Badge de promociones activas */}
          <PromoBadge restaurantId={restaurant.id} />
        </div>

        {/* Card body */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Logo + Name */}
          <div className="flex items-start gap-3 mb-3">
            <RestaurantLogo name={restaurant.name} logoUrl={restaurant.logoUrl} className="h-10 w-10 rounded-xl text-base" />
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-gray-900 dark:text-gray-50 group-hover:text-orange-500 transition-colors leading-tight line-clamp-1">
                {restaurant.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{restaurant.district || restaurant.city}</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          {restaurant.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {restaurant.categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs rounded-full font-medium border border-orange-100 dark:border-orange-500/20"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {restaurant.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1 leading-relaxed">
              {restaurant.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{formatRating(restaurant.avgRating)}</span>
              <span>({restaurant.totalRatings})</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{restaurant.totalCapacity}</span>
            </div>
            {restaurant.hasWifi && <Wifi className="h-3.5 w-3.5 text-blue-400" />}
            {restaurant.hasParking && <Car className="h-3.5 w-3.5 text-green-400" />}
            {restaurant.acceptsReservations && (
              <span className="ml-auto font-semibold text-orange-500">Reservar →</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-lg w-4/5 animate-pulse" />
      </div>
    </div>
  );
}
