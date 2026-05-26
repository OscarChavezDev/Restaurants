'use client';

import Link from 'next/link';
import { MapPin, Star, Calendar, UtensilsCrossed, ArrowRight, Building2 } from 'lucide-react';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { useTranslation } from '@/hooks/useTranslation';

export default function HomePage() {
  const t = useTranslation();

  const features = [
    { icon: UtensilsCrossed, title: t('feat1Title'), description: t('feat1Desc') },
    { icon: Calendar,        title: t('feat2Title'), description: t('feat2Desc') },
    { icon: MapPin,          title: t('feat3Title'), description: t('feat3Desc') },
    { icon: Star,            title: t('feat4Title'), description: t('feat4Desc') },
    { icon: Calendar,        title: t('feat5Title'), description: t('feat5Desc') },
    { icon: MapPin,          title: t('feat6Title'), description: t('feat6Desc') },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">

      {/* ── Hero ── */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #9a3412 0%, #c2410c 40%, #ea580c 100%)' }}>
        {/* subtle diagonal stripe texture */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }}
        />

        {/* ── Navbar ── */}
        <nav className="relative mx-auto max-w-5xl px-4 pt-5 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
            <UtensilsCrossed className="h-5 w-5 text-orange-300" />
            Tingo Restaurants
          </span>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all duration-200"
          >
            Iniciar Sesión
          </Link>
        </nav>

        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-orange-100 text-sm font-medium mb-8 border border-white/20">
            <MapPin className="h-3.5 w-3.5" />
            Tingo María, Huánuco, Perú
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl leading-tight mb-6">
            {t('heroTitle')}
          </h1>

          <p className="text-lg text-orange-200 max-w-xl mx-auto leading-relaxed mb-10">
            {t('heroSubtitle')}
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-orange-600 shadow-lg hover:bg-orange-50 hover:scale-105 transition-all duration-200"
            >
              <UtensilsCrossed className="h-4 w-4" />
              {t('viewRestaurants')}
            </Link>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 px-7 py-3.5 text-sm font-semibold text-orange-100 hover:bg-white/10 hover:scale-105 transition-all duration-200"
            >
              {t('checkReservation')}
            </Link>
          </div>
        </div>

        {/* smooth wave into the next section */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 48" className="w-full h-12 fill-white dark:fill-zinc-900" preserveAspectRatio="none">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </header>

      {/* ── Dos caminos ── */}
      <section className="bg-white dark:bg-zinc-900 mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="slide-up" className="text-center mb-10">
          <p className="text-gray-400 dark:text-zinc-500 text-sm font-semibold uppercase tracking-widest">¿Qué quieres hacer?</p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Turista */}
          <AnimateOnScroll animation="slide-up" delay={0}>
            <Link
              href="/restaurants"
              className="group block rounded-2xl border-2 border-orange-100 dark:border-zinc-700 bg-orange-50 dark:bg-zinc-800 p-8 hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20 text-orange-500 mb-5 group-hover:scale-110 group-hover:bg-orange-200 dark:group-hover:bg-orange-500/30 transition-all duration-300">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Soy turista o cliente</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed mb-6">
                Explora restaurantes verificados, consulta menús y haz tu reserva en segundos.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400 group-hover:gap-3 transition-all duration-200">
                Explorar restaurantes <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </AnimateOnScroll>

          {/* Dueño */}
          <AnimateOnScroll animation="slide-up" delay={100}>
            <Link
              href="/register"
              className="group block rounded-2xl border-2 border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 p-8 hover:from-orange-600 hover:to-orange-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white mb-5 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tengo un restaurante</h3>
              <p className="text-sm text-orange-100 leading-relaxed mb-6">
                Regístrate gratis y llega a miles de turistas y locales de Tingo María desde el primer día.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white group-hover:gap-3 transition-all duration-200">
                Registrar mi restaurante <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-white dark:bg-zinc-900 mx-auto max-w-7xl px-4 pt-4 pb-20 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="slide-up" className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-widest mb-4">
            {t('featuresSubtitle')}
          </span>
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
            {t('featuresTitle')}
          </h2>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <AnimateOnScroll key={feature.title} animation="slide-up" delay={i * 70} className="h-full">
              <div className="group relative rounded-2xl border border-gray-100 dark:border-zinc-700/60 bg-white dark:bg-zinc-800 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col overflow-hidden">
                {/* accent glow on hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-b-2xl" />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/15 text-orange-500 dark:text-orange-400 mb-5 group-hover:scale-110 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/25 transition-all duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>

                <h3 className="font-display text-base font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed flex-1">{feature.description}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

    </div>
  );
}
