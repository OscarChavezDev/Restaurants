/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  swcMinify: false,
  images: {
    // Los dueños pegan URLs de imágenes de cualquier dominio (gallery, cover,
    // logo, platos). Desactivar la optimización evita tener que whitelistear
    // cada host en `images.domains` y permite cargar cualquier URL pública.
    unoptimized: true,
    domains: ["localhost", "api.tingo-restaurants.com"],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
