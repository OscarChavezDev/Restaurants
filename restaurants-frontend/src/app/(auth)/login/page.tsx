'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { UtensilsCrossed, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/validations/restaurantSchema';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { GoogleLoginButton } from '@/components/ui/GoogleLoginButton';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setUser(data);
      toast.success(`Bienvenido, ${data.fullName}!`);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      if (!error?.response) {
        toast.error('No se puede conectar al servidor. Espera unos segundos y vuelve a intentarlo.');
      } else if (error.response.status === 401) {
        toast.error('Email o contraseña incorrectos.');
      } else {
        toast.error('Error al iniciar sesión. Intenta de nuevo.');
      }
    },
  });

  return (
    <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Ambiente cálido */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[460px] w-[460px] rounded-full bg-orange-400/20 blur-[120px]" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-selva-400/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-orange-300/10 blur-3xl" />
      </div>

      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo con glow */}
        <div className="text-center mb-7">
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 rounded-2xl bg-orange-500 blur-xl opacity-40" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 ring-1 ring-white/40 dark:ring-white/10">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-50">Bienvenido de nuevo</h1>
          <p className="mt-1.5 text-gray-500 dark:text-gray-400 text-sm">Inicia sesión en tu cuenta</p>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-orange-900/[0.06] border border-gray-100 dark:border-gray-700 p-8">
          {/* acento superior */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-600 to-selva-500" />

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all"
            >
              {mutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando sesión...</>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">o</span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Login con Google (rol CLIENTE) */}
          <div className="flex justify-center">
            <GoogleLoginButton
              text="continue_with"
              onSuccess={(res) => {
                const user = useAuthStore.getState().user;
                if (!user) return;
                router.push(user.role === 'CLIENTE' ? '/profile/restaurants' : '/dashboard')
              }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-gray-400">
            Los clientes ingresan con Google para reservar, guardar favoritos y reseñar.
          </p>

          <div className="mt-6 text-center space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿Tienes un restaurante?{' '}
              <Link href="/register" className="text-orange-600 hover:text-orange-700 font-semibold">
                Regístralo aquí
              </Link>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Si eres cliente, ingresa o regístrate con tu cuenta de Google.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
