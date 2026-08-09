import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { slugifyCiudad } from "@/lib/clinic-options";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: clinicas }, { data: posts }] = await Promise.all([
    supabase
      .from("clinics")
      .select("slug, ciudad, updated_at")
      .eq("publicado", true),
    supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("publicado", true),
  ]);

  const paginasEstaticas: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/clinicas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/analisis/nuevo`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const ciudadesConClinica = Array.from(
    new Set(
      (clinicas ?? [])
        .map((c) => c.ciudad)
        .filter((c): c is string => Boolean(c)),
    ),
  );
  const paginasCiudad: MetadataRoute.Sitemap = ciudadesConClinica.map((ciudad) => ({
    url: `${siteUrl}/clinicas/${slugifyCiudad(ciudad)}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const paginasClinicas: MetadataRoute.Sitemap = (clinicas ?? [])
    .filter((c) => c.ciudad)
    .map((c) => ({
      url: `${siteUrl}/clinicas/${slugifyCiudad(c.ciudad!)}/${c.slug}`,
      lastModified: c.updated_at,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const paginasBlog: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...paginasEstaticas,
    ...paginasCiudad,
    ...paginasClinicas,
    ...paginasBlog,
  ];
}
