'use client';

import { useState } from 'react';
import { Users, UserPlus, Trash2, ToggleLeft, ToggleRight, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';
import type { PagedResponse } from '@/types/auth';

const PAGE_SIZES = [5, 10] as const;

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  RESTAURANTE_OWNER: 'Dueño de Restaurante',
  CLIENTE: 'Cliente',
  SYSTEM_INTEGRATION: 'Integración',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  RESTAURANTE_OWNER: 'bg-orange-100 text-orange-700',
  CLIENTE: 'bg-blue-100 text-blue-700',
  SYSTEM_INTEGRATION: 'bg-purple-100 text-purple-700',
};

const newUserSchema = z.object({
  fullName: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'RESTAURANTE_OWNER', 'CLIENTE', 'SYSTEM_INTEGRATION']),
});
type NewUserForm = z.infer<typeof newUserSchema>;

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<5 | 10>(5);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: async () => {
      const r = await api.get(`/v1/users?page=${page}&size=${pageSize}`);
      return r.data.data as PagedResponse<UserItem>;
    },
  });

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const createMutation = useMutation({
    mutationFn: (d: NewUserForm) => authService.register(d),
    onSuccess: () => {
      toast.success('Usuario creado');
      qc.invalidateQueries({ queryKey: ['users'] });
      reset();
      setShowForm(false);
    },
    onError: () => toast.error('Error: el email ya puede estar en uso'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/v1/users/${id}/role`, null, { params: { role } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Rol actualizado'); },
    onError: () => toast.error('Error al cambiar rol'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/v1/users/${id}/toggle-active`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Estado actualizado'); },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', page, pageSize] });
      toast.success('Usuario eliminado');
      if (users.length === 1 && page > 0) setPage(page - 1);
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewUserForm>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { role: 'RESTAURANTE_OWNER' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Cargando...' : `${totalElements} usuarios registrados`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">Crear nuevo usuario</h2>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input {...register('fullName')} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('email')} type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input {...register('password')} type="password" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select {...register('role')} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear usuario
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : users.length === 0 && totalElements === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="h-14 w-14 mx-auto mb-4 opacity-30" />
            <p>No hay usuarios registrados</p>
          </div>
        ) : (
          <>
            {/* Pagination — top bar */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-2.5 bg-gray-50">
              {/* Page size toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Mostrar</span>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  {PAGE_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setPageSize(s); setPage(0); }}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        pageSize === s
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-500">por página</span>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {totalElements > 0
                    ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalElements)} de ${totalElements}`
                    : '0 usuarios'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(0)}
                    disabled={page === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-gray-600 px-1 font-medium">
                    {page + 1} / {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPage(totalPages - 1)}
                    disabled={page >= totalPages - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-white">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Usuario</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Rol</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Registrado</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-semibold flex-shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.fullName}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleMutation.mutate(u.id)}
                        className="flex items-center gap-1.5 text-xs font-medium"
                      >
                        {u.active ? (
                          <><ToggleRight className="h-5 w-5 text-green-500" /><span className="text-green-600">Activo</span></>
                        ) : (
                          <><ToggleLeft className="h-5 w-5 text-gray-400" /><span className="text-gray-400">Inactivo</span></>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${u.fullName}?`)) deleteMutation.mutate(u.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
