export type RestaurantStatus = 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_CLOSED' | 'PENDING_APPROVAL';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type DishCategory = 'ENTRADAS' | 'SOPAS' | 'PLATOS_PRINCIPALES' | 'PARRILLAS' | 'MARISCOS' | 'ENSALADAS' | 'POSTRES' | 'BEBIDAS' | 'BEBIDAS_ALCOHOLICAS' | 'ESPECIALES';
export type PromotionType = 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'COMBO' | 'FREE_ITEM' | 'HAPPY_HOUR';

export interface Schedule {
  id: string;
  dayOfWeek: DayOfWeek;
  openingTime: string;
  closingTime: string;
  isClosed: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  status: RestaurantStatus;
  address: string;
  district: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  totalCapacity: number;
  minReservationSize: number;
  maxReservationSize: number;
  coverImageUrl: string;
  logoUrl: string;
  avgRating: number;
  totalRatings: number;
  acceptsReservations: boolean;
  acceptsEvents: boolean;
  hasParking: boolean;
  hasWifi: boolean;
  hasAirConditioning: boolean;
  isAccessible: boolean;
  categories: string[];
  schedules: Schedule[];
  createdAt: string;
  distanceKm?: number;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  category: DishCategory;
  price: number;
  preparationTime?: number;
  calories?: number;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string[];
}

export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  dishes: Dish[];
  createdAt: string;
}

export interface Promotion {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  promoType: PromotionType;
  discountValue?: number;
  minOrderAmount?: number;
  promoCode?: string;
  imageUrl?: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
}

export interface RestaurantImage {
  id: string;
  restaurantId: string;
  url: string;
  caption?: string;
  displayOrder: number;
  createdAt: string;
}

export interface RatingResponse {
  id: string;
  userName: string;
  score: number;
  comment?: string;
  foodScore?: number;
  serviceScore?: number;
  ambianceScore?: number;
  isVerified: boolean;
  createdAt: string;
}

export interface RatingStatsResponse {
  avgScore: number;
  avgFoodScore?: number;
  avgServiceScore?: number;
  avgAmbianceScore?: number;
  totalRatings: number;
  distribution: Record<number, number>;
}

export interface CreateRestaurantDto {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  ruc?: string;
  address: string;
  district?: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  totalCapacity: number;
  minReservationSize?: number;
  maxReservationSize?: number;
  coverImageUrl?: string;
  logoUrl?: string;
  acceptsReservations?: boolean;
  acceptsEvents?: boolean;
  hasParking?: boolean;
  hasWifi?: boolean;
  hasAirConditioning?: boolean;
  isAccessible?: boolean;
  categoryIds?: string[];
  schedules?: Partial<Schedule>[];
}
