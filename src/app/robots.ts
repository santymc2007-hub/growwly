import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/cuenta", "/clinica", "/leads", "/analisis/reclamar"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
