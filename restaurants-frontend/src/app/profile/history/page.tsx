'use client';

import { useState, useEffect } from 'react';
import { Star, MapPin, CalendarCheck, UtensilsCrossed, MessageSquare } from 'lucide-react';
import { useRatings } from '@/hooks/useRatings';
import { useMyReservations } from '@/hooks/useReservations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ClientHistoryPage() {
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
    <div className="flex flex-col h-full">
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
              <div className="text-center py-20 bg-white dark:bg-[#15120E] rounded-2xl border border-gray-100 dark:border-[#352D25]">
                <UtensilsCrossed className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aún no tienes visitas</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Tus reservas completadas aparecerán aquí.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visitedReservations.map(res => (
                  <div key={res.id} className="bg-white dark:bg-[#15120E] p-5 rounded-2xl border border-gray-100 dark:border-[#352D25] shadow-sm hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors">
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
              <div className="text-center py-20 bg-white dark:bg-[#15120E] rounded-2xl border border-gray-100 dark:border-[#352D25]">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sin reseñas</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Aún no has opinado sobre ningún restaurante.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white dark:bg-[#15120E] p-5 rounded-2xl border border-gray-100 dark:border-[#352D25] shadow-sm">
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
