import { serializarJsonLd } from "@/lib/json-ld";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarImpresionesListado } from "@/lib/clinica/registrar-impresiones-listado";
import { VistaListaMapa, VistaToggle } from "@/components/clinics/vista-lista-mapa";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  provinciaDesdeSlug,
  municipioDesdeSlugGenerico,
  formatearPrecio,
} from "@/lib/clinic-options";

type Params = { provincia: string; ciudad: string };

// cache(): generateMetadata y la página piden los centros de la
// misma provincia por separado — sin esto, esta consulta (que trae
// TODOS los centros de la provincia) se repetía dos veces por carga.
const getClinicasDeCiudad = cache(async (provinciaReal: string, ciudadSlug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("provincia", provinciaReal)
    .eq("publicado", true)
    .eq("verificado_admin", true)
    .order("destacado_ciudad", { ascending: false })
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const todas = data ?? [];
  // La ciudad real se resuelve a partir de lo que ya hay cargado para
  // esta provincia — así funciona para cualquier provincia sin
  // necesitar un callejero completo de toda España.
  const ciudadesDeProvincia = Array.from(
    new Set(todas.map((c) => c.ciudad).filter((c): c is string => Boolean(c))),
  );
  const ciudadReal = municipioDesdeSlugGenerico(ciudadSlug, ciudadesDeProvincia);
  if (!ciudadReal) return { ciudadReal: null, clinicas: [] };

  return { ciudadReal, clinicas: todas.filter((c) => c.ciudad === ciudadReal) };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { provincia, ciudad } = await params;
  const provinciaReal = provinciaDesdeSlug(provincia);
  if (!provinciaReal) return {};

  const { ciudadReal } = await getClinicasDeCiudad(provinciaReal, ciudad);
  if (!ciudadReal) return {};

  return {
    title: `Centros capilares en ${ciudadReal}`,
    description: `Directorio de centros capilares en ${ciudadReal}: técnicas, precios, valoraciones e idiomas.`,
    alternates: { canonical: `/centros/${provincia}/${ciudad}` },
  };
}

export default async function CiudadPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ vista?: string }>;
}) {
  const { provincia, ciudad } = await params;
  const { vista } = await searchParams;
  const provinciaReal = provinciaDesdeSlug(provincia);

  if (!provinciaReal) {
    notFound();
  }

  const { ciudadReal, clinicas } = await getClinicasDeCiudad(provinciaReal, ciudad);

  if (!ciudadReal) {
    notFound();
  }

  after(async () => {
    await registrarImpresionesListado(
      createAdminClient(),
      clinicas.map((c) => c.id),
      "ciudad",
    );
  });

  // Estadísticas reales calculadas a partir de los datos — nunca texto
  // inventado sobre la zona.
  const preciosDesde = clinicas
    .map((c) => c.precio_desde)
    .filter((p): p is number => p !== null);
  const preciosHasta = clinicas
    .map((c) => c.precio_hasta)
    .filter((p): p is number => p !== null);
  const precioMin = preciosDesde.length > 0 ? Math.min(...preciosDesde) : null;
  const precioMax = preciosHasta.length > 0 ? Math.max(...preciosHasta) : null;

  const zonas = Array.from(
    new Set(clinicas.map((c) => c.zona).filter((z): z is string => Boolean(z))),
  );

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Centros",
        item: `${siteUrl}/centros`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: provinciaReal,
        item: `${siteUrl}/centros/${provincia}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: ciudadReal,
        item: `${siteUrl}/centros/${provincia}/${ciudad}`,
      },
    ],
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(breadcrumbJsonLd) }}
      />
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-6 pt-8">
        <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-sm text-ink-soft">
          <Link href="/centros" className="hover:text-cyan">
            Centros
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/centros?provincia=${encodeURIComponent(provinciaReal)}`} className="hover:text-cyan">
            {provinciaReal}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink">{ciudadReal}</span>
        </nav>

        <h1 className="mt-3 font-display text-3xl text-teal-dark">
          Centros capilares en {ciudadReal}
        </h1>

        <p className="mt-3 max-w-2xl text-ink-soft">
          {clinicas.length === 0
            ? `Todavía no tenemos centros registrados en ${ciudadReal}. Echa un vistazo al resto del directorio mientras tanto.`
            : `${clinicas.length === 1 ? "Encontrado" : "Encontrados"} ${clinicas.length} ${clinicas.length === 1 ? "centro" : "centros"} en ${ciudadReal}` +
              (precioMin !== null || precioMax !== null
                ? `, con precios ${
                    precioMin !== null && precioMax !== null
                      ? `entre ${formatearPrecio(precioMin)} y ${formatearPrecio(precioMax)}`
                      : precioMin !== null
                        ? `desde ${formatearPrecio(precioMin)}`
                        : `hasta ${formatearPrecio(precioMax!)}`
                  }`
                : "") +
              (zonas.length > 0 ? `. Zonas: ${zonas.join(", ")}.` : ".")}
        </p>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-10">
        {clinicas.length > 0 ? (
          <>
            <div className="flex justify-end">
              <VistaToggle />
            </div>
            <VistaListaMapa clinicas={clinicas} vista={vista === "mapa" ? "mapa" : "lista"} />
          </>
        ) : (
          <Link
            href="/centros"
            className="inline-block rounded-full bg-teal px-6 py-3 text-sm font-medium text-paper hover:bg-teal-dark"
          >
            Ver todos los centros →
          </Link>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
