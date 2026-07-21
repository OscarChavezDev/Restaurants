'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, ChevronDown, Trash2, UtensilsCrossed, Loader2, Pencil, Eye, EyeOff, X, Image as ImageIcon, Check, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { formatCurrency } from '@/utils/formatters';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import { SelectMenu } from '@/components/ui/SelectMenu';
import toast from 'react-hot-toast';
import type { Menu, Dish } from '@/types/restaurant';
import { cn } from '@/utils/cn';

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
  const [dish, setDish] = useState({ name: '', description: '', category: 'PLATOS_PRINCIPALES', price: '', preparationTime: '', imageUrl: '' });
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [editDish, setEditDish] = useState({ name: '', description: '', category: 'PLATOS_PRINCIPALES', price: '', preparationTime: '', imageUrl: '' });
  const [confirmDeleteMenuId, setConfirmDeleteMenuId] = useState<string | null>(null);
  const [confirmDeleteDishId, setConfirmDeleteDishId] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (restaurants?.content?.length && !restaurantId) {
      setRestaurantId(restaurants.content[0].id);
    }
  }, [restaurants, restaurantId]);
  const startEdit = (d: Dish) => {
    setEditingDishId(d.id);
    setEditDish({
      name: d.name,
      description: d.description ?? '',
      category: d.category,
      price: String(d.price),
      preparationTime: d.preparationTime ? String(d.preparationTime) : '',
      imageUrl: d.imageUrl ?? '',
    });
  };

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
      imageUrl: dish.imageUrl || null, isAvailable: true, isFeatured: false,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menus', restaurantId] }); toast.success('Plato agregado'); setDish({ name: '', description: '', category: 'PLATOS_PRINCIPALES', price: '', preparationTime: '', imageUrl: '' }); setShowDishForm(null); },
    onError: () => toast.error('Error al agregar plato'),
  });

  const deleteMenu = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/menus/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menus', restaurantId] }); toast.success('Menú eliminado'); setConfirmDeleteMenuId(null); },
  });

  const deleteDish = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/dishes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menus', restaurantId] }); toast.success('Plato eliminado'); setConfirmDeleteDishId(null); },
  });

  const updateDish = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.put(`/v1/dishes/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menus', restaurantId] }); toast.success('Plato actualizado'); setEditingDishId(null); },
    onError: () => toast.error('Error al actualizar plato'),
  });

  const toggleAvail = useMutation({
    mutationFn: (id: string) => api.patch(`/v1/dishes/${id}/availability`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menus', restaurantId] }); },
    onError: () => toast.error('Error al cambiar disponibilidad'),
  });

  const inputCls = 'w-full bg-white dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm';

  return (
    <div className="h-full flex flex-col pb-10 max-w-[1400px] mx-auto w-full">
      
      {/* HEADER FIJO */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 pb-4 mb-8 pt-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-orange-500/10 rounded-2xl">
                <UtensilsCrossed className="h-7 w-7 text-orange-500" />
              </div>
              Menús y Carta
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Gestiona la oferta gastronómica y disponibilidad de platos de tu local.
            </p>
          </div>
          
          {restaurantId && !isAdmin && (
            <button 
              onClick={() => setShowMenuForm(!showMenuForm)}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" /> Nuevo Menú
            </button>
          )}
        </div>
      </div>

      {(restaurants?.content?.length ?? 0) > 1 && (
        <div className="mb-8">
          <RestaurantPicker
            restaurants={restaurants?.content ?? []}
            value={restaurantId}
            onChange={setRestaurantId}
            label="Restaurante a gestionar"
          />
        </div>
      )}

      {restaurantId && isAdmin && (
        <div className="mb-8 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-3">
          <Eye className="h-5 w-5" /> Modo lectura: el administrador puede ver los menús pero no modificarlos.
        </div>
      )}

      {showMenuForm && (
        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-orange-500/30 shadow-2xl shadow-orange-500/5 p-6 sm:p-8 mb-8 animate-pop-in relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                <Plus className="h-5 w-5" />
              </span>
              Crear Nuevo Menú
            </h3>
            <button onClick={() => setShowMenuForm(false)} className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-2xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors shadow-sm">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
            <div className="sm:col-span-4">
              <input value={menuName} onChange={e => setMenuName(e.target.value)} placeholder="Nombre del menú (Ej: Desayunos)" className={inputCls} />
            </div>
            <div className="sm:col-span-6">
              <input value={menuDesc} onChange={e => setMenuDesc(e.target.value)} placeholder="Descripción (opcional)" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <button onClick={() => createMenu.mutate()} disabled={!menuName || createMenu.isPending}
                className="w-full h-[52px] bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:dark:bg-neutral-800 disabled:text-gray-400 disabled:dark:text-neutral-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
                {createMenu.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {!restaurantId ? (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-neutral-800">
          <UtensilsCrossed className="h-16 w-16 mx-auto mb-6 text-gray-300 dark:text-neutral-700" />
          <p className="text-lg font-bold text-gray-400 dark:text-neutral-500">Selecciona un restaurante para gestionar sus menús</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-6">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-neutral-900 animate-pulse rounded-[2rem]" />)}</div>
      ) : !menus?.length ? (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-neutral-800">
          <UtensilsCrossed className="h-16 w-16 mx-auto mb-6 text-gray-300 dark:text-neutral-700" />
          <p className="text-lg font-bold text-gray-400 dark:text-neutral-500 mb-2">No hay menús aún</p>
          <p className="text-sm text-gray-500">Comienza creando tu primer menú con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {menus.map((menu: Menu) => (
            <div key={menu.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors">
              {/* MENU HEADER */}
              <div 
                onClick={() => setExpandedMenu(expandedMenu === menu.id ? null : menu.id)} 
                className={cn(
                  "flex items-center justify-between p-6 sm:p-8 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/50",
                  expandedMenu === menu.id ? "bg-gray-50 dark:bg-neutral-800/50 border-b border-gray-100 dark:border-gray-800" : ""
                )}
              >
                <div className="flex items-center gap-5 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{menu.name}</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", menu.isActive ? "bg-emerald-500" : "bg-gray-400")}></span>
                      {menu.dishes?.length ?? 0} platos registrados
                      {menu.description && <span className="hidden sm:inline"> • {menu.description}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {!isAdmin && (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setShowDishForm(showDishForm === menu.id ? null : menu.id)}
                        className="px-5 py-2.5 text-sm font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-200 dark:hover:bg-orange-500/30 transition-colors">
                        + Agregar Plato
                      </button>
                      {confirmDeleteMenuId === menu.id ? (
                        <div className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl px-3 py-2 font-bold">
                          ¿Seguro?
                          <button onClick={() => deleteMenu.mutate(menu.id)} className="hover:underline">Sí, eliminar</button>
                          <span className="text-red-300 dark:text-red-800">|</span>
                          <button onClick={() => setConfirmDeleteMenuId(null)} className="hover:underline">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteMenuId(menu.id)} className="p-2.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className={cn("p-2 rounded-full bg-white dark:bg-neutral-800 shadow-sm border border-gray-100 dark:border-neutral-700 transition-transform duration-300", expandedMenu === menu.id ? "rotate-180" : "")}>
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
              </div>

              {/* DISH FORM */}
              {showDishForm === menu.id && (
                <div className="border-b border-gray-100 dark:border-neutral-800 p-6 sm:p-8 bg-gray-50/50 dark:bg-neutral-900/30">
                  <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                    <Plus className="h-4 w-4 text-orange-500" /> Nuevo plato para &quot;{menu.name}&quot;
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (Inputs) */}
                    <div className="lg:col-span-8 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre *</label>
                          <input value={dish.name} onChange={e => setDish({...dish, name: e.target.value})} className={inputCls} placeholder="Ej. Lomo Saltado" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                          <SelectMenu
                            value={dish.category}
                            onChange={(v) => setDish({ ...dish, category: v })}
                            className="w-full"
                            options={DISH_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Precio (S/.) *</label>
                          <input value={dish.price} onChange={e => setDish({...dish, price: e.target.value})} type="number" step="0.01" className={inputCls} placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Tiempo (min)</label>
                          <div className="flex items-center justify-between bg-white dark:bg-[#252525] p-1.5 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm h-[52px]">
                            <button type="button" onClick={() => setDish({...dish, preparationTime: String(Math.max(0, (parseInt(dish.preparationTime)||0) - 5))})} className="w-10 h-full flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-[#333] dark:hover:bg-[#444] text-gray-600 dark:text-gray-300 transition-colors"><Minus className="h-4 w-4"/></button>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{dish.preparationTime || 0}</span>
                            <button type="button" onClick={() => setDish({...dish, preparationTime: String((parseInt(dish.preparationTime)||0) + 5)})} className="w-10 h-full flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-[#333] dark:hover:bg-[#444] text-gray-600 dark:text-gray-300 transition-colors"><Plus className="h-4 w-4"/></button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Descripción</label>
                        <textarea value={dish.description} onChange={e => setDish({...dish, description: e.target.value})} className={cn(inputCls, "resize-none h-[116px]")} placeholder="Detalles o ingredientes..." />
                      </div>
                    </div>
                    
                    {/* Right Column (Image & Actions) */}
                    <div className="lg:col-span-4 flex flex-col space-y-5">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Fotografía</label>
                        {dish.imageUrl ? (
                          <div className="relative w-full h-[188px] group rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-700 shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={dish.imageUrl} alt="Plato" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => setDish({ ...dish, imageUrl: '' })} className="bg-red-500 text-white rounded-full p-2.5 hover:bg-red-600 transition-colors shadow-lg transform scale-90 group-hover:scale-100 duration-200">
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 min-h-[160px] w-full">
                            <ImageUploader className="h-full w-full" compact folder={`${restaurantId}/platos`} onUploaded={(url) => setDish({ ...dish, imageUrl: url })} label="Subir foto del plato" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 pt-3 mt-auto">
                        <button onClick={() => setShowDishForm(null)} className="flex-1 h-[52px] bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-sm border border-gray-200 dark:border-neutral-700 transition-all">
                          Cancelar
                        </button>
                        <button onClick={() => createDish.mutate(menu.id)} disabled={!dish.name || !dish.price || createDish.isPending}
                          className="flex-[2] h-[52px] bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:dark:bg-neutral-800 text-white font-bold rounded-2xl text-sm shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
                          {createDish.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar Plato'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DISHES LIST */}
              {expandedMenu === menu.id && (
                <div className="p-6 sm:p-8 bg-gray-50/30 dark:bg-[#1C1C1C]/30">
                  {!menu.dishes?.length ? (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-600 border border-dashed border-gray-200 dark:border-neutral-800 rounded-3xl">
                      <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Aún no has agregado platos a este menú.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {menu.dishes.map(d => (
                        <div key={d.id} className={cn(
                          "relative overflow-hidden flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-neutral-900 rounded-3xl border shadow-sm transition-all hover:shadow-md",
                          !d.isAvailable ? "border-red-100 dark:border-red-900/30 bg-red-50/10 dark:bg-red-900/5 opacity-70" : "border-gray-100 dark:border-neutral-800"
                        )}>
                          <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                            {d.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={d.imageUrl} alt={d.name} className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border border-gray-100 dark:border-neutral-800 shadow-sm shrink-0" />
                            ) : (
                              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gray-50 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-gray-100 dark:border-neutral-700">
                                <UtensilsCrossed className="h-6 w-6 text-gray-300 dark:text-neutral-600" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">{d.name}</h4>
                                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">{d.category?.replace(/_/g,' ')}</span>
                                {!d.isAvailable && <span className="text-[10px] font-bold uppercase text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-lg">Agotado</span>}
                              </div>
                              {d.description && <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{d.description}</p>}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-lg font-extrabold text-orange-500">{formatCurrency(d.price)}</span>
                                {d.preparationTime && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                                    <Clock className="h-3.5 w-3.5" /> {d.preparationTime} min
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {!isAdmin && (
                            <div className="flex flex-col sm:flex-row items-center gap-2 ml-4 shrink-0">
                              <button onClick={() => toggleAvail.mutate(d.id)} disabled={toggleAvail.isPending}
                                title={d.isAvailable ? 'Marcar como agotado' : 'Marcar como disponible'}
                                className={cn("p-2.5 rounded-xl transition-colors", d.isAvailable ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20" : "text-gray-400 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700")}>
                                {d.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                              <button onClick={() => editingDishId === d.id ? setEditingDishId(null) : startEdit(d)}
                                title="Editar plato" className="p-2.5 text-blue-500 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-colors">
                                <Pencil className="h-4 w-4" />
                              </button>
                              {confirmDeleteDishId === d.id ? (
                                <div className="flex items-center gap-1 text-[11px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl px-2 py-1.5 font-bold whitespace-nowrap">
                                  <button onClick={() => deleteDish.mutate(d.id)} className="hover:underline">Sí</button>
                                  <span className="text-red-300 dark:text-red-800">|</span>
                                  <button onClick={() => setConfirmDeleteDishId(null)} className="hover:underline">No</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDeleteDishId(d.id)} title="Eliminar plato" className="p-2.5 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* EDIT DISH MODAL (Inline over the list) */}
                  {editingDishId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-blue-500/30 shadow-2xl shadow-blue-500/10 p-6 sm:p-8 relative w-full max-w-3xl my-auto animate-pop-in">
                        <div className="flex items-center justify-between mb-8">
                          <h2 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                              <Pencil className="h-5 w-5" />
                            </span>
                            Editar Plato
                          </h2>
                          <button onClick={() => setEditingDishId(null)} className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-2xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors shadow-sm">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                          <div className="md:col-span-6">
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre *</label>
                            <input value={editDish.name} onChange={e => setEditDish({...editDish, name: e.target.value})} className={inputCls} placeholder="Nombre" />
                          </div>
                          <div className="md:col-span-6">
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                            <SelectMenu
                              value={editDish.category}
                              onChange={(v) => setEditDish({ ...editDish, category: v })}
                              className="w-full"
                              options={DISH_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, ' ') }))}
                            />
                          </div>
                          <div className="md:col-span-12">
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Descripción</label>
                            <input value={editDish.description} onChange={e => setEditDish({...editDish, description: e.target.value})} className={inputCls} placeholder="Descripción" />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Precio (S/.) *</label>
                            <input value={editDish.price} onChange={e => setEditDish({...editDish, price: e.target.value})} type="number" step="0.01" className={inputCls} placeholder="0.00" />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Tiempo (min)</label>
                            <div className="flex items-center justify-between bg-white dark:bg-[#252525] p-1.5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm h-[52px]">
                              <button type="button" onClick={() => setEditDish({...editDish, preparationTime: String(Math.max(0, (parseInt(editDish.preparationTime)||0) - 5))})} className="w-10 h-full flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-[#333] dark:hover:bg-[#444] text-gray-600 dark:text-gray-300 transition-colors"><Minus className="h-4 w-4"/></button>
                              <span className="font-bold text-gray-900 dark:text-white text-sm">{editDish.preparationTime || 0}</span>
                              <button type="button" onClick={() => setEditDish({...editDish, preparationTime: String((parseInt(editDish.preparationTime)||0) + 5)})} className="w-10 h-full flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-[#333] dark:hover:bg-[#444] text-gray-600 dark:text-gray-300 transition-colors"><Plus className="h-4 w-4"/></button>
                            </div>
                          </div>
                          <div className="md:col-span-6">
                            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1">Fotografía</label>
                            {editDish.imageUrl ? (
                              <div className="relative inline-block group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={editDish.imageUrl} alt="Plato" className="h-[52px] w-[52px] object-cover rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm" />
                                <button onClick={() => setEditDish({ ...editDish, imageUrl: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-[52px] flex items-center">
                                <ImageUploader compact folder={`${restaurantId}/platos`} onUploaded={(url) => setEditDish({ ...editDish, imageUrl: url })} label="Subir foto" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-8 flex items-center justify-end gap-3 p-4 rounded-[2rem] border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/30">
                          <button onClick={() => setEditingDishId(null)} className="px-6 py-3.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 rounded-2xl transition-all shadow-sm bg-transparent">
                            Cancelar
                          </button>
                          <button
                            onClick={() => updateDish.mutate({ id: editingDishId, data: {
                              name: editDish.name, description: editDish.description, category: editDish.category,
                              price: parseFloat(editDish.price),
                              preparationTime: editDish.preparationTime ? parseInt(editDish.preparationTime) : null,
                              imageUrl: editDish.imageUrl || null,
                            } })}
                            disabled={!editDish.name || !editDish.price || updateDish.isPending}
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:dark:bg-neutral-800 disabled:text-gray-400 disabled:dark:text-neutral-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98]"
                          >
                            {updateDish.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} Guardar Cambios
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
