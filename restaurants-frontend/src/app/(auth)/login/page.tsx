'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { UtensilsCrossed, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft, Sparkles, Building2, ShieldCheck, UserCheck, Code2, Heart, Tag, Compass, Key, Zap, Layers } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/validations/restaurantSchema';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { GoogleLoginButton } from '@/components/ui/GoogleLoginButton';
import { cn } from '@/utils/cn';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [roleTab, setRoleTab] = useState<'cliente' | 'socio' | 'desarrollador'>('cliente');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setUser(data);
      toast.success(`¡Bienvenido, ${data.fullName}!`);
      if (roleTab === 'desarrollador') {
        router.push('/dashboard/api-keys');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (error: any) => {
      if (!error?.response) {
        toast.error('No se puede conectar al servidor. Intenta de nuevo.');
      } else if (error.response.status === 401) {
        toast.error('Email o contraseña incorrectos.');
      } else {
        toast.error('Error al iniciar sesión. Intenta de nuevo.');
      }
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-orange-600/20 blur-[140px]" />
        <div className="absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-orange-400/10 blur-[140px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700/80 p-6 sm:p-8 my-auto">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-700/80 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-extrabold tracking-wide uppercase border border-orange-500/20">
            <Sparkles className="h-3.5 w-3.5" /> RestoPoint • Tingo María
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Portal de Acceso
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
            Selecciona tu perfil para continuar de forma rápida y segura.
          </p>
        </div>

        {/* Tabs */}
        <div className="p-1.5 bg-gray-100 dark:bg-gray-900/60 rounded-2xl flex items-center gap-1.5 border border-gray-200/60 dark:border-gray-700/60 mb-7">
          {([
            { key: 'cliente', icon: UserCheck, label: 'Cliente / Comensal' },
            { key: 'socio', icon: Building2, label: 'Dueño / Socio' },
            { key: 'desarrollador', icon: Code2, label: 'Desarrolladores' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRoleTab(key)}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2",
                roleTab === key
                  ? "bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-md scale-[1.01]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* TAB CLIENTE */}
        {roleTab === 'cliente' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-in fade-in slide-in-from-right-2 duration-300 py-1">
            <div className="md:col-span-6 space-y-3">
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                Tu experiencia en 1 clic
              </h3>
              <div className="space-y-2.5">
                {[
                  { icon: Compass, color: 'text-orange-500', title: 'Explorar Restaurantes', desc: 'Menús actualizados y fotos reales.' },
                  { icon: Heart, color: 'text-red-500', title: 'Reseñas y Favoritos', desc: 'Guarda y califica tus lugares preferidos.' },
                  { icon: Tag, color: 'text-blue-500', title: 'Promos Exclusivas', desc: 'Descuentos directos al instante.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                    <Icon className={`h-5 w-5 ${color} shrink-0`} />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">{title}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-6 p-7 sm:p-8 rounded-2xl bg-gradient-to-br from-orange-50/80 to-orange-100/50 dark:from-orange-500/10 dark:to-orange-500/5 border border-orange-200/80 dark:border-orange-500/20 shadow-inner flex flex-col items-center justify-center gap-4">
              <GoogleLoginButton text="continue_with" onSuccess={() => router.push('/restaurants')} />
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                Acceso rápido y seguro con Google.
              </div>
            </div>
          </div>
        )}

        {/* TAB SOCIO */}
        {roleTab === 'socio' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-in fade-in slide-in-from-left-2 duration-300 py-1">
            <div className="md:col-span-5 space-y-3">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold">
                Portal Administrativo
              </span>
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                Gestión para Dueños
              </h3>
              <div className="space-y-2">
                {[
                  { icon: UtensilsCrossed, color: 'text-orange-500', title: 'Menú y Mesas', desc: 'Control total de tu negocio en vivo.' },
                  { icon: Layers, color: 'text-green-500', title: 'Llegadas y Reservas', desc: 'Administración en tiempo real.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                    <Icon className={`h-4 w-4 ${color} shrink-0`} />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">{title}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700/80">
                ¿Sin cuenta aún?{' '}
                <Link href="/register" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">Regístrala aquí</Link>
              </p>
            </div>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Correo Empresarial</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...register('email')} type="email" placeholder="admin@turestaurante.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
                </div>
                {errors.email && <p className="mt-1 text-xs font-semibold text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs font-semibold text-red-500">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</> : 'Ingresar como Socio'}
              </button>
            </form>
          </div>
        )}

        {/* TAB DESARROLLADOR */}
        {roleTab === 'desarrollador' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-in fade-in slide-in-from-left-2 duration-300 py-1">
            <div className="md:col-span-5 space-y-3">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold">
                Acceso Developers
              </span>
              <h3 className="font-display text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                API & Integraciones
              </h3>
              <div className="space-y-2">
                {[
                  { icon: Key, color: 'text-orange-500', title: 'API Keys REST', desc: 'Conecta apps móviles y webhooks.' },
                  { icon: Zap, color: 'text-yellow-500', title: 'Endpoints & Swagger', desc: 'Documentación interactiva.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                    <Icon className={`h-4 w-4 ${color} shrink-0`} />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">{title}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700/80">
                ¿Necesitas acceso API?{' '}
                <Link href="/register-developer" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">Regístrate aquí</Link>
              </p>
            </div>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Correo de Desarrollador</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...register('email')} type="email" placeholder="dev@empresa.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
                </div>
                {errors.email && <p className="mt-1 text-xs font-semibold text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs font-semibold text-red-500">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</> : 'Ingresar como Developer'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
