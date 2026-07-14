import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'RestoPoint',
    template: '%s | RestoPoint',
  },
  description: 'RestoPoint — reservas y gestión de restaurantes para la plataforma turística de Tingo María, Huánuco, Perú.',
  keywords: ['restaurantes', 'tingo maría', 'reservas', 'gastronomía', 'huánuco'],
  authors: [{ name: 'Tingo María Platform' }],
};

export const viewport: Viewport = {
  themeColor: '#FF6A00',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
