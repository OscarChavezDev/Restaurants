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
    onError: () => {
      toast.error('Credenciales inválidas. Verifica tu email y contraseña.');
    },
  });

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
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-50">Iniciar Sesión</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Sistema de Restaurantes — Tingo María</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
            >
              {mutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando sesión...</>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-orange-500 hover:text-orange-600 font-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          © 2025 Plataforma Turística Tingo María
        </p>
      </div>
    </div>
  );
}
