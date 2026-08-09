import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClinicCard } from "@/components/clinics/clinic-card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { municipioDesdeSlug, formatearPrecio } from "@/lib/clinic-options";

type Params = { ciudad: string };

async function getClinicasDeCiudad(ciudadReal: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("ciudad", ciudadReal)
    .eq("publicado", true)
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  return data ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { ciudad } = await params;
  const ciudadReal = municipioDesdeSlug(ciudad);
  if (!ciudadReal) return {};

  return {
    title: `Clínicas capilares en ${ciudadReal}`,
    description: `Directorio de clínicas capilares en ${ciudadReal}: técnicas, precios, valoraciones e idiomas.`,
    alternates: { canonical: `/clinicas/${ciudad}` },
  };
}

export default async function CiudadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { ciudad } = await params;
  const ciudadReal = municipioDesdeSlug(ciudad);

  if (!ciudadReal) {
    notFound();
  }

  const clinicas = await getClinicasDeCiudad(ciudadReal);

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
        name: "Clínicas",
        item: `${siteUrl}/clinicas`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: ciudadReal,
        item: `${siteUrl}/clinicas/${ciudad}`,
      },
    ],
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-6 pt-8">
        <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-sm text-ink-soft">
          <Link href="/clinicas" className="hover:text-cyan">
            Clínicas
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink">{ciudadReal}</span>
        </nav>

        <h1 className="mt-3 font-display text-3xl text-teal-dark">
          Clínicas capilares en {ciudadReal}
        </h1>

        <p className="mt-3 max-w-2xl text-ink-soft">
          {clinicas.length === 0
            ? `Todavía no tenemos clínicas registradas en ${ciudadReal}. Echa un vistazo al resto del directorio mientras tanto.`
            : `Encontrado ${clinicas.length} ${clinicas.length === 1 ? "clínica" : "clínicas"} en ${ciudadReal}` +
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

      <div className="mx-auto max-w-6xl px-6 py-10">
        {clinicas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clinicas.map((clinic) => (
              <ClinicCard key={clinic.id} clinic={clinic} />
            ))}
          </div>
        ) : (
          <Link
            href="/clinicas"
            className="inline-block rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper hover:bg-teal-dark"
          >
            Ver todas las clínicas →
          </Link>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
