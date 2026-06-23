'use client';

import Link from 'next/link';
import { MapPin, Star, Calendar, UtensilsCrossed, ArrowRight, Building2 } from 'lucide-react';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { ThemeLangSwitch } from '@/components/ui/ThemeLangSwitch';
import { AuthNav } from '@/components/ui/AuthNav';
import { Footer } from '@/components/ui/Footer';
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
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <header
        className="relative overflow-hidden min-h-[100dvh] flex flex-col bg-gradient-to-br from-[#7C2D12] via-[#C2410C] to-[#E8590C] dark:from-[#240B03] dark:via-[#5A1F0C] dark:to-[#7C2D12]"
      >
        {/* glow cálido + textura diagonal sutil */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 90% at 75% 8%, rgba(255,196,140,0.25) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }}
        />

        {/* ── Navbar ── */}
        <nav className="relative w-full px-6 pt-5 sm:px-10 lg:px-12 flex items-center justify-between gap-3 flex-wrap">
          <span className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
            <UtensilsCrossed className="h-5 w-5 text-orange-200" />
            Tingo Restaurants
          </span>
          <div className="flex items-center gap-2">
            <ThemeLangSwitch />
            <AuthNav />
          </div>
        </nav>

        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 text-center flex-1 flex flex-col justify-center items-center w-full z-10 pb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-8 border border-white/20">
            <MapPin className="h-3.5 w-3.5" />
            Tingo María, Huánuco, Perú
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-tight mb-6 [text-shadow:0_2px_24px_rgba(0,0,0,0.15)] max-w-4xl">
            {t('heroTitle')}
          </h1>

          <p className="text-lg md:text-xl text-orange-100/90 max-w-2xl mx-auto leading-relaxed mb-10">
            {t('heroSubtitle')}
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-orange-600 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-orange-50 hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <UtensilsCrossed className="h-5 w-5" />
              {t('viewRestaurants')}
            </Link>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-md px-8 py-4 text-base font-bold text-white hover:bg-white/20 hover:scale-105 hover:border-white/50 transition-all duration-300 active:scale-95"
            >
              {t('checkReservation')}
            </Link>
          </div>
        </div>

        {/* onda hacia la siguiente sección (fondo cálido) */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 48" className="w-full h-12 fill-[#FAF8F5] dark:fill-[#15120E]" preserveAspectRatio="none">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </header>

      {/* ── Dos caminos ── */}
      <section className="bg-gray-50 mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="slide-up" className="text-center mb-10">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest">¿Qué quieres hacer?</p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Turista */}
          <AnimateOnScroll animation="slide-up" delay={0}>
            <Link
              href="/restaurants"
              className="group block rounded-2xl border border-orange-100 bg-orange-50 p-8 hover:border-orange-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-5 group-hover:scale-110 transition-all duration-300">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Soy cliente</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Explora restaurantes verificados, consulta menús y haz tu reserva en segundos.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 group-hover:gap-3 transition-all duration-200">
                Explorar restaurantes <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </AnimateOnScroll>

          {/* Dueño */}
          <AnimateOnScroll animation="slide-up" delay={100}>
            <Link
              href="/register"
              className="group relative block overflow-hidden rounded-2xl p-8 text-white shadow-lg shadow-orange-600/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #E8590C 0%, #C2410C 100%)' }}
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
      <section className="bg-gray-50 mx-auto max-w-7xl px-4 pt-4 pb-20 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="slide-up" className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold uppercase tracking-widest mb-4">
            {t('featuresSubtitle')}
          </span>
          <h2 className="font-display text-3xl font-bold text-gray-900">
            {t('featuresTitle')}
          </h2>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <AnimateOnScroll key={feature.title} animation="slide-up" delay={i * 70} className="h-full">
              <div className="group relative rounded-2xl border border-gray-100 bg-white p-7 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col overflow-hidden">
                {/* línea de acento en hover */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-b-2xl" />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 mb-5 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>

                <h3 className="font-display text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{feature.description}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
