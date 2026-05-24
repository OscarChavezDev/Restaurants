'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { UtensilsCrossed, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '@/validations/restaurantSchema';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'RESTAURANTE_OWNER' } as never,
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterFormData) =>
      authService.register({ fullName: data.fullName, email: data.email, password: data.password, role: 'RESTAURANTE_OWNER' }),
    onSuccess: (data) => {
      setUser(data);
      toast.success('¡Cuenta creada! Bienvenido.');
      router.push('/dashboard');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'Error al registrarse');
    },
  });

  const inputCls = 'w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-900 flex items-center justify-center p-4">
      {/* Back button */}
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 shadow-lg mb-4">
            <UtensilsCrossed className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-50">Registra tu Restaurante</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Únete a la plataforma turística de Tingo María</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div>
              <label className={labelCls}>Nombre completo</label>
              <input {...register('fullName')} placeholder="Tu nombre" className={inputCls} />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Correo electrónico</label>
              <input {...register('email')} type="email" placeholder="tu@email.com" className={inputCls} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Contraseña</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Confirmar contraseña</label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors mt-2"
            >
              {mutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta...</>
                : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          © 2025 Plataforma Turística Tingo María
        </p>
      </div>
    </div>
  );
}
