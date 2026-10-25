import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";
import { todasLasLandings } from "@/lib/seo/landings";
import { todasLasPaginasRanking } from "@/lib/seo/mejores-datos";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: clinicas }, { data: posts }, { data: tratamientos }] = await Promise.all([
    supabase
      .from("clinics")
      .select("slug, provincia, ciudad, updated_at")
      .eq("publicado", true)
      .eq("verificado_admin", true),
    supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("publicado", true),
    supabase
      .from("tratamientos")
      .select("slug, updated_at")
      .eq("publicado", true),
  ]);

  const paginasEstaticas: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/centros`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/tratamientos`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/analisis/nuevo`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const ciudadesConClinica = Array.from(
    new Set(
      (clinicas ?? [])
        .filter((c) => c.ciudad)
        .map((c) => `${c.provincia}|||${c.ciudad}`),
    ),
  );
  const paginasCiudad: MetadataRoute.Sitemap = ciudadesConClinica.map((clave) => {
    const [provincia, ciudad] = clave.split("|||");
    return {
      url: `${siteUrl}/centros/${slugifyProvincia(provincia)}/${slugifyCiudad(ciudad)}`,
      changeFrequency: "weekly",
      priority: 0.7,
    };
  });

  const paginasProvincia: MetadataRoute.Sitemap = Array.from(
    new Set((clinicas ?? []).map((c) => c.provincia)),
  ).map((provincia) => ({
    url: `${siteUrl}/centros/${slugifyProvincia(provincia)}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Landings tratamiento × lugar: solo las que tienen ≥2 centros reales.
  const paginasLanding: MetadataRoute.Sitemap = (await todasLasLandings()).map((ruta) => ({
    url: `${siteUrl}${ruta}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Rankings «Las mejores clínicas de … en …» (≥3 centros).
  const paginasRanking: MetadataRoute.Sitemap = (await todasLasPaginasRanking()).map((ruta) => ({
    url: `${siteUrl}${ruta}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const paginasClinicas: MetadataRoute.Sitemap = (clinicas ?? [])
    .filter((c) => c.ciudad)
    .map((c) => ({
      url: `${siteUrl}/centros/${slugifyProvincia(c.provincia)}/${slugifyCiudad(c.ciudad!)}/${c.slug}`,
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

  const paginasTratamientos: MetadataRoute.Sitemap = (tratamientos ?? []).map((t) => ({
    url: `${siteUrl}/tratamientos/${t.slug}`,
    lastModified: t.updated_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...paginasEstaticas,
    ...paginasProvincia,
    ...paginasCiudad,
    ...paginasLanding,
    ...paginasRanking,
    ...paginasClinicas,
    ...paginasBlog,
    ...paginasTratamientos,
  ];
}
