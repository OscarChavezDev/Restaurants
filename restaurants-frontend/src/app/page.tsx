'use client';

import Link from 'next/link';
import { MapPin, Star, Calendar, UtensilsCrossed, ArrowRight, Building2, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { ThemeLangSwitch } from '@/components/ui/ThemeLangSwitch';
import { AuthNav } from '@/components/ui/AuthNav';
import { Footer } from '@/components/ui/Footer';
import { BrandMark } from '@/components/ui/BrandMark';
import { useTranslation } from '@/hooks/useTranslation';

export default function HomePage() {
  const t = useTranslation();

  const features = [
    { icon: UtensilsCrossed, title: t('feat1Title'), description: t('feat1Desc'), span: 'lg:col-span-2' },
    { icon: Calendar,        title: t('feat2Title'), description: t('feat2Desc'), span: 'lg:col-span-1' },
    { icon: MapPin,          title: t('feat3Title'), description: t('feat3Desc'), span: 'lg:col-span-1' },
    { icon: Star,            title: t('feat4Title'), description: t('feat4Desc'), span: 'lg:col-span-1' },
    { icon: Calendar,        title: t('feat5Title'), description: t('feat5Desc'), span: 'lg:col-span-1' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0908] selection:bg-orange-500/30">
      {/* ── Hero ── */}
      <header className="relative min-h-[100dvh] flex flex-col overflow-hidden">
        {/* Background Gradients & Textures */}
        <div className="absolute inset-0 z-0">
          {/* Subtle mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-orange-100/30 dark:from-[#1A100C] dark:via-[#0A0908] dark:to-[#1A100C]" />
          
          {/* Glow spheres */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-400/20 dark:bg-orange-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-glow" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-400/20 dark:bg-rose-900/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
          
          {/* Texture pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '16px 16px' }}
          />
        </div>

        {/* ── Navbar ── */}
        <nav className="relative z-50 w-full px-6 pt-6 sm:px-10 lg:px-12 flex items-center justify-between gap-3 flex-wrap">
          <span className="flex items-center gap-3 font-extrabold text-3xl tracking-tight">
            <BrandMark className="h-12 w-12 drop-shadow-sm text-orange-600 dark:text-orange-500" />
            <span className="text-gray-900 dark:text-white">Resto<span className="text-orange-500">Point</span></span>
          </span>
          <div className="flex items-center gap-2">
            <ThemeLangSwitch />
            <AuthNav />
          </div>
        </nav>

        {/* ── Hero Content ── */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center h-full">
            
            {/* Left Column: Text & CTA */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left pt-10 lg:pt-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100/50 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 text-sm font-semibold mb-8 backdrop-blur-md">
                <Sparkles className="h-4 w-4" />
                <span>La mejor experiencia gastronómica en Tingo María</span>
              </div>
              
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-6">
                Descubre sabores <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-500 dark:from-orange-400 dark:to-rose-400">
                  excepcionales
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed mb-10">
                Reserva mesa en los restaurantes más exclusivos de la ciudad de la Bella Durmiente. Sin complicaciones, desde tu celular.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link
                  href="/restaurants"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-600/30 hover:bg-orange-700 hover:scale-105 hover:shadow-orange-600/40 transition-all duration-300 active:scale-95"
                >
                  <UtensilsCrossed className="h-5 w-5" />
                  Explorar Restaurantes
                </Link>
                <Link
                  href="/reservations"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-gray-900/80 px-8 py-4 text-base font-bold text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all duration-300 active:scale-95 backdrop-blur-sm"
                >
                  Ver mis reservas
                </Link>
              </div>

              {/* Social Proof Stats */}
              <div className="mt-12 flex items-center gap-8 text-gray-500 dark:text-gray-400">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">50+</span>
                  <span className="text-sm font-medium">Restaurantes</span>
                </div>
                <div className="w-px h-10 bg-gray-200 dark:bg-gray-800" />
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">10k+</span>
                  <span className="text-sm font-medium">Reservas</span>
                </div>
                <div className="w-px h-10 bg-gray-200 dark:bg-gray-800" />
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-2xl font-black text-gray-900 dark:text-white">
                    4.9 <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </span>
                  <span className="text-sm font-medium">Calificación Promedio</span>
                </div>
              </div>
            </div>

            {/* Right Column: Floating Bento Graphics */}
            <div className="relative hidden lg:block h-full min-h-[500px] w-full">
              {/* Card 1: Restaurant Preview */}
              <div className="absolute top-10 right-0 w-[300px] rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white dark:border-gray-700 shadow-2xl p-5 animate-float" style={{ animationDelay: '0s' }}>
                <div className="w-full h-32 rounded-2xl bg-gradient-to-br from-orange-200 to-rose-200 dark:from-orange-900/50 dark:to-rose-900/50 mb-4 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-black/5" />
                   <UtensilsCrossed className="h-10 w-10 text-white drop-shadow-md" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">El Encanto de la Selva</h3>
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-3 w-3" /> Av. Alameda Perú 123
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold">Abierto hoy</div>
                  <div className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 4.8</div>
                </div>
              </div>

              {/* Card 2: Reservation Success */}
              <div className="absolute bottom-20 left-10 w-[260px] rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white dark:border-gray-700 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-5 animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">¡Reserva Confirmada!</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mesa para 4, 8:00 PM</p>
                  </div>
                </div>
                <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-4">
                  <div className="w-full h-full bg-green-500 rounded-full" />
                </div>
              </div>

              {/* Card 3: User Avatar / Quick action */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-10 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl p-3 flex items-center gap-3 animate-float" style={{ animationDelay: '4s' }}>
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 border-2 border-white dark:border-gray-900 shadow-sm" />
                <div className="pr-2">
                  <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-1.5" />
                  <div className="h-2 w-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Soft bottom transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAF8F5] dark:from-[#0A0908] to-transparent z-10 pointer-events-none" />
      </header>

      {/* ── Dos Caminos (CTA Entrelazado) ── */}
      <section className="relative z-20 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Soy Cliente */}
          <AnimateOnScroll animation="slide-up" delay={0}>
            <Link
              href="/restaurants"
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl p-8 hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Soy Comensal</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                  Explora restaurantes verificados, consulta menús y asegura tu mesa en segundos.
                </p>
              </div>
              <div className="h-12 w-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-600 group-hover:text-white text-gray-400 dark:text-gray-500 transition-all duration-300">
                <ChevronRight className="h-5 w-5" />
              </div>
            </Link>
          </AnimateOnScroll>

          {/* Tengo un Restaurante */}
          <AnimateOnScroll animation="slide-up" delay={100}>
            <Link
              href="/register"
              className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 overflow-hidden rounded-3xl border border-orange-200/50 dark:border-orange-900/30 p-8 shadow-xl shadow-orange-600/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Background with animated gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-rose-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
              
              <div className="relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white mb-5 group-hover:scale-110 group-hover:bg-white/30 transition-transform duration-300 backdrop-blur-sm">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Tengo un Restaurante</h3>
                <p className="text-orange-100/90 max-w-xs">
                  Abre tu local a miles de comensales. Gestiona reservas, menús y más en una sola plataforma.
                </p>
              </div>
              <div className="relative z-10 h-12 w-12 rounded-full bg-white/20 text-white flex items-center justify-center group-hover:bg-white group-hover:text-orange-600 transition-all duration-300 backdrop-blur-sm">
                <ChevronRight className="h-5 w-5" />
              </div>
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <AnimateOnScroll animation="slide-up" className="text-center mb-16 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-widest mb-4">
            <Star className="h-3.5 w-3.5" /> {t('featuresSubtitle')}
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Todo lo que necesitas para una velada perfecta
          </h2>
        </AnimateOnScroll>

        {/* Removed fixed auto-rows height for better responsiveness */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <AnimateOnScroll key={feature.title} animation="slide-up" delay={i * 50} className={feature.span}>
              <div className="group relative w-full h-full min-h-[220px] rounded-3xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm hover:shadow-2xl hover:border-orange-300/50 dark:hover:border-orange-500/50 transition-all duration-500 overflow-hidden flex flex-col justify-between z-10">
                {/* Subtle gradient background instead of flat white */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 dark:to-[#111] opacity-50 z-0" />
                
                {/* Giant faded background icon */}
                <feature.icon className="absolute -right-8 -bottom-8 h-48 w-48 text-gray-100 dark:text-white/5 opacity-50 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 z-0" />

                {/* Background glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-400/20 transition-colors duration-500 z-0" />
                
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 mb-6 shadow-inner border border-gray-100 dark:border-gray-700 group-hover:scale-110 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>

                <div className="relative z-10 mt-auto">
                  <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{feature.title}</h3>
                  <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">{feature.description}</p>
                </div>
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
