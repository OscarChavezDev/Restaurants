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

function ReservationRow({
  res,
  canManage,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  onReview,
  confirmPending,
  cancelPending,
  completePending,
  noShowPending,
}: {
  res: Reservation;
  canManage: boolean;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  onReview?: (id: string) => void;
  confirmPending: boolean;
  cancelPending: boolean;
  completePending: boolean;
  noShowPending: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{res.customerName}</p>
            <span className="text-xs text-gray-400">|</span>
            <p className="text-xs text-gray-400 font-mono">{res.confirmationCode}</p>
          </div>
          <p className="text-sm text-gray-500">
            {formatDate(res.reservationDate)} · {formatTime(res.startTime)} · {res.partySize} personas
          </p>
          {res.customerPhone && (
            <p className="text-xs text-gray-400">{res.customerPhone}</p>
          )}
          {res.restaurantName && (
            <p className="text-xs text-orange-500 font-medium">{res.restaurantName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[res.status])}>
          {STATUS_LABELS[res.status]}
        </span>

        {canManage && res.status === 'PENDING' && (
          <button
            onClick={() => onConfirm(res.id)}
            disabled={confirmPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Confirmar
          </button>
        )}

        {canManage && res.status === 'CONFIRMED' && (
          <>
            <button
              onClick={() => onComplete(res.id)}
              disabled={completePending}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Completar
            </button>
            <button
              onClick={() => onNoShow(res.id)}
              disabled={noShowPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              <UserX className="h-3.5 w-3.5" /> No se presentó
            </button>
          </>
        )}

        {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
          <button
            onClick={() => onCancel(res.id)}
            disabled={cancelPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            <XCircle className="h-3.5 w-3.5" /> Cancelar
          </button>
        )}

        {!canManage && res.status === 'COMPLETED' && onReview && (
          <button
            onClick={() => onReview(res.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Star className="h-3.5 w-3.5" /> Dejar reseña
          </button>
        )}
      </div>
    </div>
  );
}

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

  // Para owners/admins: selector de restaurante + reservas por restaurante
  const { data: myRestaurants } = useMyRestaurants();
  const { data: allRestaurants } = useRestaurants(0, 100);
  const restaurantList = isAdmin ? allRestaurants : myRestaurants;

  const { data: restaurantReservations, isLoading: loadingRestaurant } =
    useRestaurantReservations(restaurantId, 0, 50);

  // Para clientes: sus propias reservas
  const { data: myReservations, isLoading: loadingMine } = useMyReservations();

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
      </div>
    );
  }

  // ── Vista CLIENTE ────────────────────────────────────────────
  const reservations = myReservations?.content ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Mis Reservas</h1>
        <p className="text-gray-600 mt-1">Tu historial de reservas</p>
      </div>

      {loadingMine ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-24">
          <Calendar className="h-16 w-16 mx-auto text-gray-200 mb-4" />
          <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">Sin reservas</h3>
          <p className="text-gray-500">No tienes reservas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => <ReservationRow key={res.id} res={res} {...rowProps} />)}
        </div>
      )}

      <RatingModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        loading={ratingLoading}
      />
    </div>
  );
}
