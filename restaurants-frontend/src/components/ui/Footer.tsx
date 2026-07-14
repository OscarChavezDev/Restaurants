import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-[#15120E] border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Col 1: About */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Fogón <span className="text-orange-600">Selva</span>
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              La plataforma turística oficial para descubrir, reservar y disfrutar de la mejor gastronomía en la Ciudad de la Bella Durmiente.
            </p>
            <div className="flex items-center gap-4 text-gray-400">
              <a href="#" className="hover:text-orange-600 transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-orange-600 transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-orange-600 transition-colors"><Instagram className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Col 2: Explorar */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Explorar</h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/restaurants" className="hover:text-orange-600 transition-colors">Todos los Restaurantes</Link></li>
              <li><Link href="/restaurants?category=platos_tipicos" className="hover:text-orange-600 transition-colors">Platos Típicos</Link></li>
              <li><Link href="/restaurants?open=true" className="hover:text-orange-600 transition-colors">Abiertos Ahora</Link></li>
              <li><Link href="/reservations" className="hover:text-orange-600 transition-colors">Consultar mi Reserva</Link></li>
            </ul>
          </div>

          {/* Col 3: Soporte */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Soporte</h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="#" className="hover:text-orange-600 transition-colors">Centro de Ayuda</Link></li>
              <li><Link href="#" className="hover:text-orange-600 transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link href="#" className="hover:text-orange-600 transition-colors">Términos y Condiciones</Link></li>
              <li><Link href="#" className="hover:text-orange-600 transition-colors">Política de Privacidad</Link></li>
            </ul>
          </div>

          {/* Col 4: Contacto */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Contacto</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-600 shrink-0" />
                <span>Av. Alameda Perú N° 525, Tingo María, Huánuco, Perú</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-orange-600 shrink-0" />
                <span>+51 987 654 321</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-orange-600 shrink-0" />
                <span>soporte@fogonselva.pe</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Fogón Selva. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Hecho con CORAZÖN para Tingo María</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
