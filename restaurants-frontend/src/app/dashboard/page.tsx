'use client';

import { useAuthStore } from '@/store/authStore';
import { AdminDashboard } from '@/features/dashboard/components/AdminDashboard';
import { OwnerDashboard } from '@/features/dashboard/components/OwnerDashboard';

export default function DashboardPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());

  return isAdmin ? <AdminDashboard /> : <OwnerDashboard />;
}
