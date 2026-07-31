import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
