import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
  const title = `${d.tratamiento.nombre} en ${d.ciudadReal}: ${d.centros.length} centros y precios`;
  const description = `Compara ${d.centros.length} centros verificados que ofrecen ${enFrase(d.tratamiento.nombre)} en ${lugar}${precios ? `, precios ${precios}` : ""}. Opiniones, técnicas y contacto. Pide presupuesto gratis.`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description } };
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
  if (!d) notFound();

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
