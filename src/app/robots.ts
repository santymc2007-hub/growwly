import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";

export default function robots(): MetadataRoute.Robots {
  // ⚠️ NOINDEX TEMPORAL — bloqueado por completo mientras la web está en
  // pruebas. Las fichas no publicadas dan 404 y no están en el sitemap,
  // así que tampoco saldrán en Google después del lanzamiento. Al lanzar, cambiar disallow por la lista de rutas privadas
  // (ver comentario abajo) y avisar a Claude para quitar el noindex del
  // layout raíz también.
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };

  // Versión para cuando se lance de verdad:
  // return {
  //   rules: {
  //     userAgent: "*",
  //     allow: "/",
  //     disallow: [
  //       "/admin", "/cuenta", "/clinica", "/leads", "/analisis/reclamar",
  //       "/denunciar", "/emails", "/solicitudes", "/solicitud-enviada",
  //     ],
  //   },
  //   sitemap: `${siteUrl}/sitemap.xml`,
  // };
}
