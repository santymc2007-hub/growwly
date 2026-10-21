import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { tituloSeo, textoTitle, metaSeo } from "@/lib/seo/meta";
import { getLanding } from "@/lib/seo/landing-datos";
import { LandingTratamiento } from "@/components/tratamientos/landing-tratamiento";
import { nombreProvinciaBuscable, rangoPrecios, enFrase } from "@/lib/seo/landings";

type Params = { slug: string; provincia: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, provincia } = await params;
  const d = await getLanding(slug, provincia);
  if (!d) return {};
  const lugar = nombreProvinciaBuscable(d.provinciaReal, d.centros);
  const precios = rangoPrecios(d.centros);
  const url = `/tratamientos/${slug}/${provincia}`;
  const sitio = lugar;
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
    openGraph: { title: textoTitle(title), description },
  };
}

export default async function LandingProvinciaPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ vista?: string }>;
}) {
  const { slug, provincia } = await params;
  const { vista } = await searchParams;
  const d = await getLanding(slug, provincia);
  if (!d) notFound();

  const lugar = nombreProvinciaBuscable(d.provinciaReal, d.centros);
  const url = `/tratamientos/${slug}/${provincia}`;

  return (
    <LandingTratamiento
      tratamiento={d.tratamiento}
      lugarNombre={lugar}
      provinciaReal={d.provinciaReal}
      centros={d.centros}
      url={url}
      vista={vista}
      ciudades={d.ciudades}
      migas={[
        { label: "Tratamientos", href: "/tratamientos" },
        { label: d.tratamiento.nombre, href: `/tratamientos/${slug}` },
        { label: lugar, href: url },
      ]}
    />
  );
}
