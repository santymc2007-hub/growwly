import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
  const title = `${d.tratamiento.nombre} en ${lugar}: ${d.centros.length} centros y precios`;
  const description = `Compara ${d.centros.length} centros verificados que ofrecen ${enFrase(d.tratamiento.nombre)} en ${lugar}${precios ? `, precios ${precios}` : ""}. Opiniones, técnicas y contacto. Pide presupuesto gratis.`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description } };
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
