import { notFound } from "next/navigation";
import { redirigirSlugAntiguo } from "@/lib/seo/redirigir-slug-antiguo";
import type { Metadata } from "next";
import { tituloSeo, textoTitle, metaSeo, OG_BASE } from "@/lib/seo/meta";
import { getLanding } from "@/lib/seo/landing-datos";
import { LandingTratamiento } from "@/components/tratamientos/landing-tratamiento";
import {
  nombreCiudadBuscable,
  nombreProvinciaBuscable,
  rangoPrecios,
  enFrase,
} from "@/lib/seo/landings";

type Params = { slug: string; provincia: string; ciudad: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, provincia, ciudad } = await params;
  const d = await getLanding(slug, provincia, ciudad);
  if (!d) return {};
  const lugar = nombreCiudadBuscable(d.ciudadReal!, d.provinciaReal);
  const precios = rangoPrecios(d.centros);
  const url = `/tratamientos/${slug}/${provincia}/${ciudad}`;
  const sitio = d.ciudadReal!;
  const n = d.centros.length;
  const title = tituloSeo(
    `${d.tratamiento.nombre} en ${sitio}: ${n} centros y precios`,
    `${d.tratamiento.nombre} en ${sitio}: precios`,
    `${d.tratamiento.nombre} en ${sitio}`,
  );
  const description = metaSeo(
    `Compara ${n} centros verificados que ofrecen ${enFrase(d.tratamiento.nombre)} en ${lugar}.`,
    [precios ? `Precios publicados ${precios}.` : null, "Opiniones, técnicas y ubicación."],
    "Pide presupuesto gratis.",
  );
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      ...OG_BASE,
      url: url, title: textoTitle(title), description },
  };
}

export default async function LandingCiudadPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ vista?: string }>;
}) {
  const { slug, provincia, ciudad } = await params;
  const { vista } = await searchParams;
  const d = await getLanding(slug, provincia, ciudad);
  if (!d) {
    await redirigirSlugAntiguo("tratamientos", slug, (s) => `/tratamientos/${s}/${provincia}/${ciudad}`);
    notFound();
  }

  const provinciaNombre = nombreProvinciaBuscable(d.provinciaReal, d.centros);
  const url = `/tratamientos/${slug}/${provincia}/${ciudad}`;

  return (
    <LandingTratamiento
      tratamiento={d.tratamiento}
      lugarNombre={nombreCiudadBuscable(d.ciudadReal!, d.provinciaReal)}
      provinciaReal={d.provinciaReal}
      centros={d.centros}
      url={url}
      vista={vista}
      migas={[
        { label: "Tratamientos", href: "/tratamientos" },
        { label: d.tratamiento.nombre, href: `/tratamientos/${slug}` },
        { label: provinciaNombre, href: `/tratamientos/${slug}/${provincia}` },
        { label: d.ciudadReal!, href: url },
      ]}
    />
  );
}
