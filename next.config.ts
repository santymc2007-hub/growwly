import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Por defecto Next.js limita el cuerpo de una Server Action a 1MB.
      // El formulario de alta/edición de clínica sube fotos (a veces
      // varias a la vez), así que necesita bastante más margen.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      // Fotos de ejemplo mientras no hay clínicas reales en Supabase.
      { protocol: "https", hostname: "picsum.photos" },
      // Fotos reales subidas al bucket "clinic-photos" de Supabase Storage
      // (cubre cualquier proyecto, sea cual sea su project-ref).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
