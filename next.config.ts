import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // CSS en línea en el <head> en vez de un <link> que bloquea el
    // pintado: casi todo el tráfico (y todo el de pago) es de primera
    // visita, sin la hoja en caché. PageSpeed oct 2026: 450–1050 ms de
    // "solicitudes que bloquean el renderizado" en móvil.
    inlineCss: true,
    serverActions: {
      // Por defecto Next.js limita el cuerpo de una Server Action a 1MB.
      // El formulario de alta/edición de clínica sube fotos (a veces
      // varias a la vez), así que necesita bastante más margen.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    // Nuestras propias ilustraciones (public/tratamientos, etc.) son SVG
    // — Next.js las bloquea en <Image> por defecto por seguridad (XSS),
    // pero son archivos nuestros de confianza, no subidos por usuarios.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [
      // Fotos de ejemplo mientras no hay clínicas reales en Supabase.
      { protocol: "https", hostname: "picsum.photos" },
      // Fotos reales subidas al bucket "clinic-photos" de Supabase Storage
      // (cubre cualquier proyecto, sea cual sea su project-ref).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    // Cabeceras de seguridad (auditoría oct 2026). La CSP es solo
    // "estructural" a propósito: impide meter la web en un iframe
    // ajeno (clickjacking), cambiar la <base> o cargar <object>, sin
    // restringir scripts — una CSP de scripts estricta rompería Google
    // Analytics, los JSON-LD y el script de animaciones, y habría que
    // probarla con calma. NO se añade form-action: Chrome lo aplica
    // también a la redirección del login con Google y lo rompería.
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), payment=(), usb=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
  async redirects() {
    // El directorio público pasó de /clinicas a /centros. El sitio aún
    // no está indexado (noindex), pero por si alguien guardó un enlace
    // de una preview anterior, redirigimos en vez de dar un 404.
    return [
      // capilia.es (y www) y el dominio antiguo de Vercel → growwly.es, 301 conservando la ruta. Va
      // primero: requiere añadir ambos dominios al proyecto en Vercel.
      ...["capilia.es", "www.capilia.es", "growwly-theta.vercel.app"].map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://www.growwly.es/:path*",
        permanent: true,
      })),
      { source: "/clinicas", destination: "/centros", permanent: true },
      {
        source: "/clinicas/:path*",
        destination: "/centros/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
