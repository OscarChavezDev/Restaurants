'use client';

import { useAuthStore } from '@/store/authStore';
import { User as UserIcon, Mail, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Gestiona tu información personal</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl font-bold uppercase">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
              <p className="text-sm text-gray-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                Nombre Completo
              </label>
              <p className="text-gray-900 font-medium">{user.fullName}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Correo Electrónico
              </label>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Teléfono
              </label>
              <p className="text-gray-900 font-medium">
                {user.phone ? user.phone : <span className="text-gray-400 italic">No registrado</span>}
              </p>
            </div>

            {user.createdAt && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Miembro desde
                </label>
                <p className="text-gray-900 font-medium">{formatDate(user.createdAt)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            Si deseas actualizar tus datos, por favor contacta a soporte o usa el panel de configuración (próximamente).
          </p>
        </div>
      </div>
    </div>
  );
}
