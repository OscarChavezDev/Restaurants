'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { KeyRound, Mail, Lock, User, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '@/validations/restaurantSchema';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function RegisterDeveloperPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const mutation = useMutation({
    mutationFn: authService.registerDeveloper,
    onSuccess: (data) => {
      setUser(data);
      toast.success(`¡Cuenta lista, ${data.fullName}!`);
      router.push('/dashboard/api-keys');
    },
    onError: (error: any) => {
      if (!error?.response) {
        toast.error('No se puede conectar al servidor. Intenta de nuevo.');
      } else if (error.response.status === 409) {
        toast.error('Ya existe una cuenta con ese correo.');
      } else {
        toast.error('Error al registrarte. Intenta de nuevo.');
      }
    },
  });

  const field = 'w-full border border-gray-200 dark:border-gray-600/60 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-gray-700 transition';
  const label = 'block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5';
  const errCls = 'text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-orange-500/10 dark:bg-orange-600/15 blur-[130px]" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-rose-400/10 dark:bg-rose-500/15 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all shadow-sm">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio de sesión
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-xl overflow-hidden">
          <div className="h-[3px] w-full bg-gradient-to-r from-orange-500 via-rose-500 to-orange-400" />

          <div className="p-7 sm:p-8">
            {/* Title */}
            <div className="mb-6">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30">
                  <KeyRound className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">RestoPoint API</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                Cuenta de desarrollador
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                API Key instantánea al registrarte — sin aprobación.
              </p>
            </div>

            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div>
                <label className={label}>Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...register('fullName')} type="text" placeholder="Tu nombre"
                    className={`${field} pl-10`} />
                </div>
                {errors.fullName && <p className={errCls}>{errors.fullName.message}</p>}
              </div>

              <div>
                <label className={label}>Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...register('email')} type="email" placeholder="dev@empresa.com"
                    className={`${field} pl-10`} />
                </div>
                {errors.email && <p className={errCls}>{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                      className={`${field} pl-10 pr-10`} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className={errCls}>{errors.password.message}</p>}
                </div>
                <div>
                  <label className={label}>Confirmar</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                      className={`${field} pl-10 pr-10`} />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className={errCls}>{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <button type="submit" disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 mt-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                {mutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando cuenta...</>
                  : <><KeyRound className="h-4 w-4" /> Crear cuenta de desarrollador</>}
              </button>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">Inicia sesión</Link>
                {' · '}
                <Link href="/register" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">Soy dueño de restaurante</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
