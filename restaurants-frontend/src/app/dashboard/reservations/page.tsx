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
import { formatDate, formatTime, STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import type { Reservation } from '@/types/reservation';
import { RatingModal } from '@/components/ui/RatingModal';
import { useRatings } from '@/hooks/useRatings';
import { ReservationDetailsModal } from '@/components/ui/ReservationDetailsModal';

import { ReservationRow } from '@/components/ui/ReservationRow';

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

    return (
      <div>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600 mt-1">Gestiona las reservas de tus restaurantes</p>
        </div>

        <RestaurantPicker
          restaurants={restaurantList?.content ?? []}
          value={restaurantId}
          onChange={setRestaurantId}
        />

        {!restaurantId ? (
          <div className="text-center py-24">
            <Calendar className="h-16 w-16 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">Selecciona un restaurante para ver sus reservas</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-24">
            <Calendar className="h-16 w-16 mx-auto text-gray-200 mb-4" />
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">Sin reservas</h3>
            <p className="text-gray-500">Este restaurante aún no tiene reservas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((res) => <ReservationRow key={res.id} res={res} {...rowProps} />)}
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
