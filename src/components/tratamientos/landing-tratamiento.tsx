import Link from "next/link";
import { after } from "next/server";
import { serializarJsonLd } from "@/lib/json-ld";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarImpresionesListado } from "@/lib/clinica/registrar-impresiones-listado";
import { ordenarConDestacados } from "@/lib/visibilidad/destacados";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/breadcrumbs";
import { VistaListaMapa, VistaToggle } from "@/components/clinics/vista-lista-mapa";
import { rangoPrecios, hrefFicha, enFrase, type LugarLanding } from "@/lib/seo/landings";
import { SITE_URL } from "@/lib/site-url";
import type { Clinic } from "@/lib/supabase/database.types";

/**
 * Cuerpo común de /tratamientos/[slug]/[provincia] y
 * /tratamientos/[slug]/[provincia]/[ciudad]. Todo el texto sale de los
 * datos reales (nº de centros, precios publicados, ciudades) — nunca
 * cifras inventadas.
 */
export async function LandingTratamiento({
  tratamiento,
  lugarNombre,
  provinciaReal,
  centros,
  migas,
  url,
  vista,
  ciudades,
}: {
  tratamiento: { slug: string; nombre: string; resumen: string | null };
  lugarNombre: string;
  provinciaReal: string;
  centros: Clinic[];
  migas: BreadcrumbItem[];
  url: string;
  vista?: string;
  /** Solo en la landing de provincia: ciudades con landing propia. */
  ciudades?: LugarLanding["ciudades"];
}) {
  const { clinicas, idsDestacados } = await ordenarConDestacados(centros, provinciaReal);

  after(async () => {
    await registrarImpresionesListado(
      createAdminClient(),
      clinicas.map((c) => c.id),
      "tratamiento",
    );
  });

  const precios = rangoPrecios(clinicas);
  const nombreMin = enFrase(tratamiento.nombre);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tratamiento.nombre} en ${lugarNombre}`,
    url: `${SITE_URL}${url}`,
    numberOfItems: clinicas.length,
    itemListElement: clinicas.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.nombre,
      url: `${SITE_URL}${hrefFicha(c)}`,
    })),
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(itemListJsonLd) }}
      />
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-6 pt-8">
        <Breadcrumbs items={migas} />

        <h1 className="mt-3 font-display text-3xl text-teal-dark">
          {tratamiento.nombre} en {lugarNombre}
        </h1>

        <p className="mt-3 max-w-3xl text-ink-soft">
          {`En Growwly hay ${clinicas.length} centros verificados que ofrecen ${nombreMin} en ${lugarNombre}`}
          {precios ? `, con precios publicados ${precios}` : ""}.{" "}
          {tratamiento.resumen}{" "}
          <Link href={`/tratamientos/${tratamiento.slug}`} className="font-medium text-cyan hover:text-cyan-dark">
            Lee la guía completa de {nombreMin} →
          </Link>
        </p>

        <dl className="mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-4">
            <dt className="text-xs text-ink-soft">Centros verificados</dt>
            <dd className="mt-1 font-display text-2xl text-teal-dark">{clinicas.length}</dd>
          </div>
          {precios && (
            <div className="rounded-2xl border border-line bg-white p-4">
              <dt className="text-xs text-ink-soft">Precios publicados</dt>
              <dd className="mt-1 text-sm font-semibold text-teal-dark">{precios}</dd>
            </div>
          )}
          {ciudades && ciudades.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-4">
              <dt className="text-xs text-ink-soft">Ciudades</dt>
              <dd className="mt-1 font-display text-2xl text-teal-dark">{ciudades.length}</dd>
            </div>
          )}
        </dl>

        {ciudades && ciudades.length > 0 && (
          <nav aria-label="Por ciudad" className="mt-6 flex flex-wrap gap-2">
            {ciudades.map((c) => (
              <Link
                key={c.ciudadSlug}
                href={`${url}/${c.ciudadSlug}`}
                className="rounded-full bg-sage px-3 py-1 text-sm font-medium text-sage-ink hover:bg-cyan hover:text-white"
              >
                {tratamiento.nombre} en {c.ciudad} ({c.n})
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="flex justify-end">
          <VistaToggle />
        </div>
        <VistaListaMapa
          clinicas={clinicas}
          vista={vista === "mapa" ? "mapa" : "lista"}
          idsDestacados={idsDestacados}
        />
        <p className="mt-6 text-xs text-ink-soft">
          <Link href="/como-ordenamos" className="underline hover:text-teal-dark">
            Cómo ordenamos los centros
          </Link>
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
