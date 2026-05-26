'use client';

import { useState } from 'react';
import { Plus, ChevronDown, Trash2, UtensilsCrossed, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import toast from 'react-hot-toast';
import type { Menu } from '@/types/restaurant';

const DISH_CATEGORIES = ['ENTRADAS','SOPAS','PLATOS_PRINCIPALES','PARRILLAS','MARISCOS','ENSALADAS','POSTRES','BEBIDAS','BEBIDAS_ALCOHOLICAS','ESPECIALES'];

export default function MenusPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data: myRestaurants } = useMyRestaurants();
  const { data: allRestaurants } = useRestaurants(0, 100);
  const restaurants = isAdmin ? allRestaurants : myRestaurants;
  const [restaurantId, setRestaurantId] = useState('');
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showDishForm, setShowDishForm] = useState<string | null>(null);
  const [menuName, setMenuName] = useState('');
  const [menuDesc, setMenuDesc] = useState('');
  const [dish, setDish] = useState({ name: '', description: '', category: 'PLATOS_PRINCIPALES', price: '', preparationTime: '' });
  const qc = useQueryClient();

  const { data: menus, isLoading } = useQuery({
    queryKey: ['menus', restaurantId],
    queryFn: async () => {
      const r = await api.get(`/v1/menus/restaurant/${restaurantId}`);
      return r.data.data as Menu[];
    },
    enabled: !!restaurantId,
  });

  const createMenu = useMutation({
    mutationFn: () => api.post('/v1/menus', { restaurantId, name: menuName, description: menuDesc, isActive: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menus', restaurantId] }); toast.success('Menú creado'); setMenuName(''); setMenuDesc(''); setShowMenuForm(false); },
    onError: () => toast.error('Error al crear menú'),
  });

  const createDish = useMutation({
    mutationFn: (menuId: string) => api.post('/v1/dishes', {
      menuId, name: dish.name, description: dish.description, category: dish.category,
      price: parseFloat(dish.price), preparationTime: dish.preparationTime ? parseInt(dish.preparationTime) : null,
      isAvailable: true, isFeatured: false,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menus', restaurantId] }); toast.success('Plato agregado'); setDish({ name: '', description: '', category: 'PLATOS_PRINCIPALES', price: '', preparationTime: '' }); setShowDishForm(null); },
    onError: () => toast.error('Error al agregar plato'),
  });

  const deleteMenu = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/menus/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menus', restaurantId] }); toast.success('Menú eliminado'); },
  });

  const deleteDish = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/dishes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menus', restaurantId] }); toast.success('Plato eliminado'); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="font-display text-2xl font-bold text-gray-900">Menús y Platos</h1><p className="text-gray-600 mt-1">Crea menús y agrega platos a tus restaurantes</p></div>
      </div>

      <RestaurantPicker
        restaurants={restaurants?.content ?? []}
        value={restaurantId}
        onChange={(id) => { setRestaurantId(id); setShowMenuForm(false); }}
      />

      {restaurantId && !isAdmin && (
        <button onClick={() => setShowMenuForm(!showMenuForm)}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="h-4 w-4" /> Nuevo Menú
        </button>
      )}
      {restaurantId && isAdmin && (
        <p className="mb-6 text-sm text-gray-400 italic">Modo lectura — el admin puede ver menús pero no modificarlos.</p>
      )}

      {showMenuForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Crear Menú</h3>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input value={menuName} onChange={e => setMenuName(e.target.value)} placeholder="Nombre del menú *"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input value={menuDesc} onChange={e => setMenuDesc(e.target.value)} placeholder="Descripción (opcional)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <button onClick={() => createMenu.mutate()} disabled={!menuName || createMenu.isPending}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5">
              {createMenu.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Crear
            </button>
          </div>
        </div>
      )}

      {!restaurantId ? (
        <div className="text-center py-20 text-gray-400"><UtensilsCrossed className="h-14 w-14 mx-auto mb-4 opacity-30" /><p>Selecciona un restaurante para gestionar sus menús</p></div>
      ) : isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
      ) : !menus?.length ? (
        <div className="text-center py-20 text-gray-400"><UtensilsCrossed className="h-14 w-14 mx-auto mb-4 opacity-30" /><p>No hay menús aún. Crea uno con el botón de arriba.</p></div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu: Menu) => (
            <div key={menu.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <button onClick={() => setExpandedMenu(expandedMenu === menu.id ? null : menu.id)} className="flex items-center gap-3 flex-1 text-left">
                  <div><p className="font-semibold text-gray-900">{menu.name}</p><p className="text-xs text-gray-500">{menu.dishes?.length ?? 0} platos · {menu.isActive ? 'Activo' : 'Inactivo'}</p></div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 ml-2 transition-transform ${expandedMenu === menu.id ? 'rotate-180' : ''}`} />
                </button>
                {!isAdmin && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowDishForm(showDishForm === menu.id ? null : menu.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200">
                      + Plato
                    </button>
                    <button onClick={() => deleteMenu.mutate(menu.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {showDishForm === menu.id && (
                <div className="border-t border-gray-100 p-4 bg-orange-50">
                  <p className="text-xs font-semibold text-orange-700 mb-3">Agregar plato a "{menu.name}"</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <input value={dish.name} onChange={e => setDish({...dish, name: e.target.value})} placeholder="Nombre *"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <input value={dish.description} onChange={e => setDish({...dish, description: e.target.value})} placeholder="Descripción"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <select value={dish.category} onChange={e => setDish({...dish, category: e.target.value})}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                      {DISH_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
                    </select>
                    <input value={dish.price} onChange={e => setDish({...dish, price: e.target.value})} placeholder="Precio S/. *" type="number" step="0.01"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <input value={dish.preparationTime} onChange={e => setDish({...dish, preparationTime: e.target.value})} placeholder="Tiempo (min)" type="number"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <button onClick={() => createDish.mutate(menu.id)} disabled={!dish.name || !dish.price || createDish.isPending}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5">
                      {createDish.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Agregar Plato
                    </button>
                  </div>
                </div>
              )}

              {expandedMenu === menu.id && (
                <div className="border-t border-gray-100">
                  {!menu.dishes?.length ? (
                    <p className="text-center py-6 text-sm text-gray-400">Sin platos aún — haz clic en "+ Plato"</p>
                  ) : menu.dishes.map(d => (
                    <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{d.name}</span>
                        <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{d.category?.replace(/_/g,' ')}</span>
                        {d.description && <p className="text-xs text-gray-400 mt-0.5">{d.description}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-orange-600 text-sm">{formatCurrency(d.price)}</span>
                        {!isAdmin && <button onClick={() => deleteDish.mutate(d.id)} className="p-1 text-red-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
