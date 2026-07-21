'use client';

import { useAuthStore } from '@/store/authStore';
import { AdminRestaurantList } from '@/features/dashboard/components/AdminRestaurantList';
import { OwnerRestaurantRedirect } from '@/features/dashboard/components/OwnerRestaurantRedirect';

export default function RestaurantsPage() {
  const isAdmin = useAuthStore(s => s.isAdmin());

  return isAdmin ? <AdminRestaurantList /> : <OwnerRestaurantRedirect />;
}
