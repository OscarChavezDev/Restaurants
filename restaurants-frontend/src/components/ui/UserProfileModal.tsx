'use client';

import { useState, useEffect } from 'react';
import { X, User as UserIcon, Calendar, Clock, Mail, Phone, Calendar as CalendarIcon, Star, CalendarCheck, UtensilsCrossed, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useMyReservations, useCancelReservation } from '@/hooks/useReservations';
import { useRatings } from '@/hooks/useRatings';
import { ReservationRow } from '@/components/ui/ReservationRow';
import { RatingModal } from '@/components/ui/RatingModal';
import { ReservationDetailsModal } from '@/components/ui/ReservationDetailsModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectMenu } from '@/components/ui/SelectMenu';
import type { Reservation } from '@/types/reservation';
import { cn } from '@/utils/cn';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'reservations' | 'history'>('profile');

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-[#0A0908] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mi Espacio</h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex px-6 gap-6 overflow-x-auto hide-scrollbar">
            <button onClick={() => setActiveTab('profile')} className={cn("flex items-center gap-2 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors", activeTab === 'profile' ? "border-orange-500 text-orange-600 dark:text-orange-400" : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200")}>
              <UserIcon className={cn("w-4 h-4", activeTab === 'profile' ? "text-orange-500 dark:text-orange-400" : "text-gray-400")} />
              Mi Perfil
            </button>
            <button onClick={() => setActiveTab('reservations')} className={cn("flex items-center gap-2 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors", activeTab === 'reservations' ? "border-orange-500 text-orange-600 dark:text-orange-400" : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200")}>
              <Calendar className={cn("w-4 h-4", activeTab === 'reservations' ? "text-orange-500 dark:text-orange-400" : "text-gray-400")} />
              Mis Reservas
            </button>
            <button onClick={() => setActiveTab('history')} className={cn("flex items-center gap-2 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors", activeTab === 'history' ? "border-orange-500 text-orange-600 dark:text-orange-400" : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200")}>
              <Clock className={cn("w-4 h-4", activeTab === 'history' ? "text-orange-500 dark:text-orange-400" : "text-gray-400")} />
              Mi Historial
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && <ProfileContent />}
          {activeTab === 'reservations' && <ReservationsContent />}
          {activeTab === 'history' && <HistoryContent />}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PROFILE CONTENT
// ==========================================
function ProfileContent() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona tu información personal</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200/60 dark:border-gray-800 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-2xl font-bold uppercase">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.fullName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                Nombre Completo
              </label>
              <p className="text-gray-900 dark:text-white font-medium">{user.fullName}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Correo Electrónico
              </label>
              <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Teléfono
              </label>
              <p className="text-gray-900 dark:text-white font-medium">
                {user.phone ? user.phone : <span className="text-gray-400 italic">No registrado</span>}
              </p>
            </div>

            {user.createdAt && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Miembro desde
                </label>
                <p className="text-gray-900 dark:text-white font-medium">{formatDate(user.createdAt)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Si deseas actualizar tus datos, por favor contacta a soporte o usa el panel de configuración (próximamente).
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// RESERVATIONS CONTENT
// ==========================================
function ReservationsContent() {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredAndSortedReservations = reservations
    .filter(res => {
      if (statusFilter && res.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          res.restaurantName?.toLowerCase().includes(q) ||
          res.confirmationCode.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Mis Reservas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Tu historial de reservas y próximas citas</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por restaurante o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-800/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 bg-white dark:bg-gray-900/40 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-sm hover:border-gray-300 dark:hover:border-gray-700"
          />
        </div>
        <SelectMenu
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'CONFIRMED', label: 'Confirmada' },
            { value: 'COMPLETED', label: 'Completada' },
            { value: 'CANCELLED', label: 'Cancelada' },
          ]}
          className="min-w-[180px]"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filteredAndSortedReservations.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin reservas"
          description="No se encontraron reservas con esos filtros."
          glowColor="orange"
        />
      ) : (
        <div className="space-y-3">
          {filteredAndSortedReservations.map((res) => (
            <ReservationRow
              key={res.id}
              res={res}
              canManage={false}
              onConfirm={() => { }}
              onComplete={() => { }}
              onNoShow={() => { }}
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

      {/* These sub-modals will render above the UserProfileModal because of z-index but RatingModal needs high z-index */}
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

// ==========================================
// HISTORY CONTENT
// ==========================================
function HistoryContent() {
  const [activeTab, setActiveTab] = useState<'visited' | 'reviews'>('visited');
  const { data: myReservations, isLoading: loadingReservations } = useMyReservations();
  const { getMyRatings, loading: loadingRatings } = useRatings();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (activeTab === 'reviews') {
      const fetchReviews = async () => {
        setIsLoadingReviews(true);
        try {
          const data = await getMyRatings(0, 50);
          setReviews(data?.content || []);
        } catch (error) {
          console.error("Error fetching reviews", error);
        } finally {
          setIsLoadingReviews(false);
        }
      };
      fetchReviews();
    }
  }, [activeTab, getMyRatings]);

  const visitedReservations = myReservations?.content?.filter(r => r.status === 'COMPLETED') || [];

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Mi Historial</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Revisa los restaurantes que has visitado y las opiniones que has dejado.</p>
      </div>

      <div className="flex space-x-1 bg-gray-100/50 dark:bg-[#15120E] p-1 rounded-xl mb-6 w-full max-w-md border border-gray-100 dark:border-[#352D25]">
        <button
          onClick={() => setActiveTab('visited')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'visited'
              ? 'bg-white dark:bg-[#2C251E] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-[#44403C]'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Restaurantes Visitados
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'reviews'
              ? 'bg-white dark:bg-[#2C251E] text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-[#44403C]'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Mis Reseñas
        </button>
      </div>

      <div className="flex-1">
        {activeTab === 'visited' && (
          <div className="space-y-4">
            {loadingReservations ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-[#15120E] rounded-xl" />)}
              </div>
            ) : visitedReservations.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="Aún no tienes visitas"
                description="Tus reservas completadas aparecerán aquí."
                glowColor="emerald"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visitedReservations.map(res => (
                  <div key={res.id} className="bg-white dark:bg-[#15120E] p-5 rounded-2xl border border-gray-200/60 dark:border-[#352D25] shadow-md hover:border-orange-300 dark:hover:border-orange-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{res.restaurantName}</h4>
                      <span className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-xs px-2 py-1 rounded-md font-medium">
                        Visitado
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-orange-500" />
                        <span>{format(new Date(res.reservationDate), "dd 'de' MMMM, yyyy", { locale: es })} a las {res.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                        <span>{res.partySize} personas</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {isLoadingReviews || loadingRatings ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-[#15120E] rounded-xl" />)}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Sin reseñas"
                description="Aún no has opinado sobre ningún restaurante."
                glowColor="blue"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white dark:bg-[#15120E] p-5 rounded-2xl border border-gray-200/60 dark:border-[#352D25] shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{review.restaurantName || 'Restaurante'}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.score ? 'fill-orange-400 text-orange-400' : 'fill-gray-200 text-gray-200 dark:fill-[#2C251E] dark:text-[#2C251E]'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        <div>{format(new Date(review.createdAt), "dd MMM yyyy", { locale: es })}</div>
                        {review.isVerified ? (
                          <span className="text-green-600 dark:text-green-400 font-medium inline-block mt-1">Reserva Verificada</span>
                        ) : (
                          <span className="text-gray-500 font-medium inline-block mt-1">Visita Directa</span>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm italic">"{review.comment}"</p>
                    )}
                    {review.ownerReply && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-[#2C251E] rounded-xl text-sm border-l-2 border-orange-400">
                        <span className="font-semibold text-gray-900 dark:text-white block mb-1">Respuesta del restaurante:</span>
                        <span className="text-gray-600 dark:text-gray-300">{review.ownerReply}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
