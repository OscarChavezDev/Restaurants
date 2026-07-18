'use client';

import { useEffect } from 'react';
import { X, Check, UtensilsCrossed, Sparkles, Coffee, Fish, Pizza, Salad, IceCream, Soup, Wine, Flame, Beef } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Category { id: string; name: string }

const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('cafe') || n.includes('cafetería') || n.includes('desayuno')) return Coffee;
  if (n.includes('marisco') || n.includes('pescado') || n.includes('ceviche') || n.includes('sushi')) return Fish;
  if (n.includes('parrilla') || n.includes('brasa') || n.includes('pollo')) return Flame;
  if (n.includes('carne') || n.includes('steak')) return Beef;
  if (n.includes('pizza') || n.includes('pasta') || n.includes('italiana')) return Pizza;
  if (n.includes('veg') || n.includes('saludable') || n.includes('ensalada')) return Salad;
  if (n.includes('postre') || n.includes('helado') || n.includes('dulce')) return IceCream;
  if (n.includes('chifa') || n.includes('asiat') || n.includes('oriental') || n.includes('sopa') || n.includes('criolla') || n.includes('peruana') || n.includes('selv')) return Soup;
  if (n.includes('bebida') || n.includes('jugo') || n.includes('trago')) return Wine;
  return UtensilsCrossed;
};

export function CategoryModal({
  open,
  onClose,
  categories,
  selected,
  onToggle,
  onClear,
  resultsCount,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  resultsCount: number;
}) {
  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />

      {/* Ventana */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-slide-up">
        {/* Acento superior */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-600 to-selva-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-3 border-b border-gray-50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100/50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900 dark:text-gray-50">¿Qué te apetece hoy?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Descubre tus platos favoritos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 transition-colors" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categorías */}
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[55vh] overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {categories.map((c, i) => {
            const active = selected.includes(c.id);
            const Icon = getCategoryIcon(c.name);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggle(c.id)}
                style={{ animationDelay: `${Math.min(i * 35, 280)}ms` }}
                className={cn(
                  'group relative flex flex-col items-center gap-2 rounded-2xl p-4 text-center animate-pop-in border-2',
                  'transition-all duration-200 hover:-translate-y-1 active:scale-95',
                  active
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 shadow-md shadow-orange-500/10'
                    : 'border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm hover:border-gray-200 dark:hover:border-gray-600'
                )}
              >
                <span className={cn(
                  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl transition-all duration-300 group-hover:scale-110',
                  active ? 'bg-orange-500 text-white shadow-sm' : 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm'
                )}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className={cn('text-sm font-bold leading-tight transition-colors', active ? 'text-orange-700 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300')}>
                  {c.name}
                </span>
                {active && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white animate-pop shadow-sm">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClear}
            disabled={selected.length === 0}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition-colors"
          >
            Limpiar{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.03] active:scale-95"
          >
            Ver {resultsCount} resultado{resultsCount === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  );
}
