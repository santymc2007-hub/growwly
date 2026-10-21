import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es";

/**
 * Web en producción (lanzada oct 2026): todo indexable salvo las zonas
 * privadas. Las fichas no publicadas dan 404 y no están en el sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/cuenta",
        "/clinica/",
        "/leads",
        "/analisis/reclamar",
        "/denunciar",
        "/emails",
        "/solicitudes",
        "/solicitud-enviada",
        "/api/",
        "/auth/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
