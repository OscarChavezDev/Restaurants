'use client';

import { motion } from 'framer-motion';
import { UtensilsCrossed, MonitorPlay } from 'lucide-react';
import { useTables } from '@/hooks/useTables';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function LiveTableMap({ restaurantId }: { restaurantId: string }) {
  const { tables, isLoading, updateStatus } = useTables(restaurantId);

  const toggleTableStatus = async (tableId: string, currentStatus: string) => {
    // Si está disponible, la ocupamos. Si está ocupada, la liberamos.
    const nextStatus = currentStatus === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
    const loadingToast = toast.loading('Actualizando mesa...');
    try {
      await updateStatus.mutateAsync({ tableId, status: nextStatus });
      toast.success(`Mesa ${nextStatus === 'AVAILABLE' ? 'liberada' : 'ocupada'}`, { id: loadingToast });
    } catch (e) {
      toast.error('Error al actualizar', { id: loadingToast });
    }
  };

  if (isLoading) {
    return <div className="h-48 w-full bg-gray-50 dark:bg-neutral-800 animate-pulse rounded-3xl" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-gray-100 dark:border-neutral-700 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
          <MonitorPlay className="h-5 w-5 text-orange-500" /> Estado de Mesas (En Vivo)
        </h3>
        <div className="flex items-center gap-3 text-xs font-medium text-gray-600 dark:text-gray-300">
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"/> Libre</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"/> Ocupada</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-300"/> Inactiva</span>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No tienes mesas configuradas. Puedes agregarlas desde la pestaña de Restaurante.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {tables.map(table => {
            const isAvailable = table.currentStatus === 'AVAILABLE' || !table.currentStatus;
            const isOccupied = table.currentStatus === 'OCCUPIED';
            return (
              <button
                key={table.id}
                disabled={!table.isActive || updateStatus.isPending}
                onClick={() => toggleTableStatus(table.id, table.currentStatus || 'AVAILABLE')}
                className={cn(
                  "relative aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all group overflow-hidden",
                  {
                    "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40": table.isActive && isAvailable,
                    "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40": table.isActive && isOccupied,
                    "border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/50 opacity-50 cursor-not-allowed": !table.isActive
                  }
                )}
              >
                {/* Indicador de color arriba */}
                <div className={cn("absolute top-0 left-0 right-0 h-1.5", {
                  "bg-green-500": table.isActive && isAvailable,
                  "bg-red-500": table.isActive && isOccupied,
                  "bg-gray-300 dark:bg-neutral-600": !table.isActive
                })} />
                
                <span className={cn("font-display font-bold text-lg", {
                  "text-green-700 dark:text-green-400": table.isActive && isAvailable,
                  "text-red-700 dark:text-red-400": table.isActive && isOccupied,
                  "text-gray-400 dark:text-gray-500": !table.isActive
                })}>
                  {table.tableNumber}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1">
                  {table.capacity} pax
                </span>

                {/* Overlay de hover para indicar la acción */}
                {table.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold px-2 text-center">
                      {isAvailable ? 'Ocupar Mesa' : 'Liberar Mesa'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
