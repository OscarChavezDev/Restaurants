'use client';

import { Calendar, CheckCircle, XCircle, CheckCheck, UserX, Star } from 'lucide-react';
import { useState } from 'react';
import {
  useMyReservations,
  useRestaurantReservations,
  useCancelReservation,
  useConfirmReservation,
  useCompleteReservation,
  useNoShowReservation,
} from '@/hooks/useReservations';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import { SelectMenu } from '@/components/ui/SelectMenu';
import { formatDate, formatTime, STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import type { Reservation } from '@/types/reservation';
import { RatingModal } from '@/components/ui/RatingModal';
import { useRatings } from '@/hooks/useRatings';
import { ReservationDetailsModal } from '@/components/ui/ReservationDetailsModal';

import { ReservationRow } from '@/components/ui/ReservationRow';


import { useEffect } from 'react';

export default function ReservationsPage() {
  const isOwner = useAuthStore((s) => s.isOwner());
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const cancelMutation = useCancelReservation();
  const confirmMutation = useConfirmReservation();
  const completeMutation = useCompleteReservation();
  const noShowMutation = useNoShowReservation();
  const [restaurantId, setRestaurantId] = useState('');
  const { createRating, loading: ratingLoading } = useRatings();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewReservationId, setReviewReservationId] = useState('');

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Para owners/admins: selector de restaurante + reservas por restaurante
  const { data: myRestaurants } = useMyRestaurants();
  const { data: allRestaurants } = useRestaurants(0, 100);
  const restaurantList = isAdmin ? allRestaurants : myRestaurants;

  useEffect(() => {
    if (restaurantList?.content && restaurantList.content.length === 1 && !restaurantId) {
      setRestaurantId(restaurantList.content[0].id);
    }
  }, [restaurantList?.content, restaurantId]);

  const { data: restaurantReservations, isLoading: loadingRestaurant } =
    useRestaurantReservations(restaurantId, 0, 50);

  const { data: myReservations } = useMyReservations(); // Mantenemos el hook para que no falle si TS lo usa pero lo ignoraremos. En un mundo ideal lo quitamos.

  const handleConfirm = async (id: string) => {
    try {
      await confirmMutation.mutateAsync(id);
      toast.success('Reserva confirmada');
    } catch {
      toast.error('Error al confirmar la reserva');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync({ id, reason: 'Cancelada desde el panel' });
      toast.success('Reserva cancelada');
    } catch {
      toast.error('Error al cancelar la reserva');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeMutation.mutateAsync(id);
      toast.success('Reserva marcada como completada');
    } catch {
      toast.error('Error al completar la reserva');
    }
  };

  const handleNoShow = async (id: string) => {
    try {
      await noShowMutation.mutateAsync(id);
      toast.success('Reserva marcada como no-show');
    } catch {
      toast.error('Error al marcar no-show');
    }
  };

  const handleOpenReview = (id: string) => {
    setReviewReservationId(id);
    setReviewModalOpen(true);
  };

  const handleViewDetails = (res: Reservation) => {
    setSelectedReservation(res);
    setDetailsModalOpen(true);
  };

  const handleSubmitReview = async (data: any) => {
    try {
      await createRating({
        reservationId: reviewReservationId,
        ...data
      });
      toast.success('Reseña publicada exitosamente');
      setReviewModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al publicar reseña');
    }
  };

  const rowProps = {
    canManage: isOwner || isAdmin,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    onComplete: handleComplete,
    onNoShow: handleNoShow,
    onReview: handleOpenReview,
    confirmPending: confirmMutation.isPending,
    cancelPending: cancelMutation.isPending,
    completePending: completeMutation.isPending,
    noShowPending: noShowMutation.isPending,
    onViewDetails: handleViewDetails,
  };

  // ── Vista OWNER / ADMIN ──────────────────────────────────────
  if (isOwner || isAdmin) {
    const reservations = restaurantReservations?.content ?? [];
    const isLoading = loadingRestaurant && !!restaurantId;

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredAndSortedReservations = reservations
      .filter(res => {
        if (statusFilter && res.status !== statusFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            res.customerName?.toLowerCase().includes(q) ||
            res.confirmationCode.toLowerCase().includes(q) ||
            res.customerEmail?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 pb-4 mb-6 pt-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
          <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-orange-500/10 rounded-2xl">
              <Calendar className="h-7 w-7 text-orange-500" />
            </div>
            Reservas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Gestiona las reservas de tus restaurantes.</p>
        </div>

        {(!restaurantList?.content || restaurantList.content.length > 1) && (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-gray-100 dark:border-neutral-800 shadow-sm mb-6">
            <RestaurantPicker
              restaurants={restaurantList?.content ?? []}
              value={restaurantId}
              onChange={setRestaurantId}
            />
          </div>
        )}

        {restaurantId && (
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por cliente, correo o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900/40 border border-gray-200 dark:border-gray-800/60 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-gray-400"
              />
            </div>
            <SelectMenu
              value={statusFilter}
              onChange={setStatusFilter}
              className="sm:w-[200px]"
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'PENDING', label: 'Pendiente' },
                { value: 'CONFIRMED', label: 'Confirmada' },
                { value: 'ARRIVED', label: 'Cliente Llegó' },
                { value: 'COMPLETED', label: 'Completada' },
                { value: 'CANCELLED', label: 'Cancelada' },
                { value: 'NO_SHOW', label: 'No asistió' },
              ]}
            />
          </div>
        )}

        {!restaurantId ? (
          <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-gray-200 dark:border-neutral-800 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Selecciona un restaurante para ver sus reservas</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl dark:bg-neutral-800" />)}</div>
        ) : filteredAndSortedReservations.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-gray-200 dark:border-neutral-800 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-1">Sin reservas</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron reservas con esos filtros</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {filteredAndSortedReservations.map((res) => <ReservationRow key={res.id} res={res} {...rowProps} />)}
          </div>
        )}

        <ReservationDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          reservation={selectedReservation}
        />
      </div>
    );
  }

  return null;
}
