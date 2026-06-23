'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyReservations, useCancelReservation } from '@/hooks/useReservations';
import { useRatings } from '@/hooks/useRatings';
import { ReservationRow } from '@/components/ui/ReservationRow';
import { RatingModal } from '@/components/ui/RatingModal';
import { ReservationDetailsModal } from '@/components/ui/ReservationDetailsModal';
import type { Reservation } from '@/types/reservation';

export default function ClientReservationsPage() {
  const { data: myReservations, isLoading } = useMyReservations();
  const cancelMutation = useCancelReservation();
  const { createRating, loading: ratingLoading } = useRatings();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewReservationId, setReviewReservationId] = useState('');
  
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync({ id, reason: 'Cancelada por el cliente' });
      toast.success('Reserva cancelada');
    } catch {
      toast.error('Error al cancelar la reserva');
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

  const reservations = myReservations?.content ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Mis Reservas</h1>
        <p className="text-gray-600 mt-1">Tu historial de reservas y próximas citas</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin reservas</h3>
          <p className="text-gray-500">Aún no tienes reservas registradas en ningún restaurante.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => (
            <ReservationRow
              key={res.id}
              res={res}
              canManage={false}
              onConfirm={() => {}}
              onComplete={() => {}}
              onNoShow={() => {}}
              onCancel={handleCancel}
              onReview={handleOpenReview}
              onViewDetails={handleViewDetails}
              confirmPending={false}
              completePending={false}
              noShowPending={false}
              cancelPending={cancelMutation.isPending}
            />
          ))}
        </div>
      )}

      <RatingModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSubmit={handleSubmitReview}
        loading={ratingLoading}
      />

      <ReservationDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        reservation={selectedReservation}
      />
    </div>
  );
}
