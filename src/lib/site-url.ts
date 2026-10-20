/** Dominio canónico de la web. Todas las URLs absolutas (canonical, sitemap, JSON-LD) salen de aquí. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es").replace(/\/$/, "");
