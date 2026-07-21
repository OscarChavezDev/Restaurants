'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMyRestaurants } from '@/hooks/useRestaurants';

export function OwnerRestaurantRedirect() {
  const router = useRouter();
  const { data: ownerData } = useMyRestaurants();

  useEffect(() => {
    if (ownerData) {
      if (ownerData.content.length === 0) {
        router.replace('/dashboard/restaurants/new');
      } else {
        router.replace(`/dashboard/restaurants/${ownerData.content[0].id}`);
      }
    }
  }, [ownerData, router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
    </div>
  );
}
