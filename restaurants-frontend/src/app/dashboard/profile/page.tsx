'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Phone, Lock, Eye, EyeOff, Save, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { CustomerHistorySection } from '@/components/profile/CustomerHistorySection';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  RESTAURANTE_OWNER: 'Dueño de Restaurante',
  CLIENTE: 'Cliente',
  SYSTEM_INTEGRATION: 'Integración de Sistema',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  RESTAURANTE_OWNER: 'bg-orange-100 text-orange-700',
  CLIENTE: 'bg-blue-100 text-blue-700',
  SYSTEM_INTEGRATION: 'bg-purple-100 text-purple-700',
};

const profileSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres').max(150),
  phone: z.string().regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Teléfono inválido').or(z.literal('')).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Debe tener mayúsculas, minúsculas, número y carácter especial'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface ProfileData {
  id: string; email: string; fullName: string; phone?: string;
  role: string; active: boolean; createdAt: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const r = await api.get('/v1/users/me');
      return r.data.data as ProfileData;
    },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { fullName: profile?.fullName ?? '', phone: profile?.phone ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const updateProfile = useMutation({
    mutationFn: (d: ProfileForm) => api.patch('/v1/users/me', d),
    onSuccess: (res) => {
      const updated = res.data.data as ProfileData;
      qc.invalidateQueries({ queryKey: ['profile'] });
      if (user) setUser({ ...user, fullName: updated.fullName });
      toast.success('Perfil actualizado');
    },
    onError: () => toast.error('Error al actualizar el perfil'),
  });

  const updatePassword = useMutation({
    mutationFn: (d: PasswordForm) =>
      api.patch('/v1/users/me', { currentPassword: d.currentPassword, newPassword: d.newPassword }),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Contraseña actualizada');
    },
    onError: () => toast.error('Contraseña actual incorrecta'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const initials = (profile?.fullName ?? user?.fullName ?? 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Administra tu información personal y seguridad</p>
      </div>

      {/* Avatar + info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex items-center gap-5">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white text-2xl font-bold shadow-md">
          {initials}
        </div>
        <div>
          <p className="font-display text-xl font-bold text-gray-900">{profile?.fullName}</p>
          <p className="text-sm text-gray-500 mt-0.5">{profile?.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[profile?.role ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
              <ShieldCheck className="h-3 w-3" />
              {ROLE_LABELS[profile?.role ?? ''] ?? profile?.role}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${profile?.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {profile?.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Datos personales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-display text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <User className="h-4 w-4 text-orange-500" /> Datos personales
        </h2>
        <form onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              {...profileForm.register('fullName')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {profileForm.formState.errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" /> Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              {...profileForm.register('phone')}
              placeholder="Ej: 962 345 678"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {profileForm.formState.errors.phone && (
              <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={profile?.email ?? ''}
              disabled
              className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">El email no puede modificarse</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-display text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <Lock className="h-4 w-4 text-orange-500" /> Cambiar contraseña
        </h2>
        <form onSubmit={passwordForm.handleSubmit((d) => updatePassword.mutate(d))} className="space-y-4">
          {[
            { name: 'currentPassword' as const, label: 'Contraseña actual', show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { name: 'newPassword' as const, label: 'Nueva contraseña', show: showNew, toggle: () => setShowNew(v => !v) },
            { name: 'confirmPassword' as const, label: 'Confirmar nueva contraseña', show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ name, label, show, toggle }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input
                  {...passwordForm.register(name)}
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors[name] && (
                <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors[name]?.message}</p>
              )}
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={updatePassword.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {updatePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Cambiar contraseña
            </button>
          </div>
        </form>
      </div>
    </div>

    {profile?.role === 'CLIENTE' && (
      <div className="max-w-4xl mt-8">
        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Mi historial</h2>
        <CustomerHistorySection />
      </div>
    )}
    </>
  );
}
