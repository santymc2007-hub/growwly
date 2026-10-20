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
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ordenarConDestacados } from "@/lib/visibilidad/destacados";
import { provinciaDesdeSlug, slugifyCiudad } from "@/lib/clinic-options";
import {
  nombreProvinciaBuscable,
  rangoPrecios,
  tecnicasMasComunes,
  lugaresConLanding,
} from "@/lib/seo/landings";

type Params = { provincia: string };

const getCentrosDeProvincia = cache(async (provinciaReal: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("provincia", provinciaReal)
    .eq("publicado", true)
    .eq("verificado_admin", true)
    .order("nombre", { ascending: true });
  return data ?? [];
});

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { provincia } = await params;
  const provinciaReal = provinciaDesdeSlug(provincia);
  if (!provinciaReal) return {};
  const centros = await getCentrosDeProvincia(provinciaReal);
  if (centros.length === 0) return { robots: { index: false, follow: true } };

  const lugar = nombreProvinciaBuscable(provinciaReal, centros);
  const precios = rangoPrecios(centros);
  const tecnicas = tecnicasMasComunes(centros).join(", ");
  return {
    title: `Clínicas capilares en ${lugar}: ${centros.length} centros comparados`,
    description: `Compara ${centros.length} clínicas y centros capilares verificados en ${lugar}${tecnicas ? `: ${tecnicas}` : ""}${precios ? `. Precios ${precios}` : ""}. Opiniones y presupuesto gratis.`,
    alternates: { canonical: `/centros/${provincia}` },
  };
}

export default async function ProvinciaPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ vista?: string }>;
}) {
  const { provincia } = await params;
  const { vista } = await searchParams;
  const provinciaReal = provinciaDesdeSlug(provincia);
  if (!provinciaReal) notFound();

  const todos = await getCentrosDeProvincia(provinciaReal);
  const { clinicas, idsDestacados } = await ordenarConDestacados(todos, provinciaReal);

  after(async () => {
    await registrarImpresionesListado(
      createAdminClient(),
      clinicas.map((c) => c.id),
      "ciudad",
    );
  });

  const lugar = nombreProvinciaBuscable(provinciaReal, clinicas);
  const precios = rangoPrecios(clinicas);

  const ciudades = [...new Set(clinicas.map((c) => c.ciudad).filter((c): c is string => Boolean(c)))]
    .map((ciudad) => ({ ciudad, n: clinicas.filter((c) => c.ciudad === ciudad).length }))
    .sort((a, b) => b.n - a.n);

  // Tratamientos con landing en esta provincia (≥2 centros).
  const supabase = await createClient();
  const { data: tratamientos } = await supabase
    .from("tratamientos")
    .select("slug, nombre, tecnica_relacionada")
    .eq("publicado", true)
    .not("tecnica_relacionada", "is", null)
    .order("nombre");
  const tratamientosConLanding = (tratamientos ?? [])
    .map((t) => ({
      ...t,
      n: clinicas.filter((c) => c.tecnicas.includes(t.tecnica_relacionada as string)).length,
    }))
    .filter((t) =>
      lugaresConLanding(clinicas.filter((c) => c.tecnicas.includes(t.tecnica_relacionada as string)))
        .length > 0,
    );

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-6 pt-8">
        <Breadcrumbs
          items={[
            { label: "Centros", href: "/centros" },
            { label: lugar, href: `/centros/${provincia}` },
          ]}
        />

        <h1 className="mt-3 font-display text-3xl text-teal-dark">Clínicas capilares en {lugar}</h1>

        <p className="mt-3 max-w-2xl text-ink-soft">
          {clinicas.length === 0
            ? `Todavía no tenemos centros registrados en ${lugar}.`
            : `${clinicas.length} centros capilares verificados en ${lugar}${
                precios ? `, con precios publicados ${precios}` : ""
              }.`}
        </p>

        {ciudades.length > 0 && (
          <nav aria-label="Por ciudad" className="mt-5 flex flex-wrap gap-2">
            {ciudades.map((c) => (
              <Link
                key={c.ciudad}
                href={`/centros/${provincia}/${slugifyCiudad(c.ciudad)}`}
                className="rounded-full bg-sage px-3 py-1 text-sm font-medium text-sage-ink hover:bg-cyan hover:text-white"
              >
                {c.ciudad} ({c.n})
              </Link>
            ))}
          </nav>
        )}

        {tratamientosConLanding.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-lg text-teal-dark">Por tratamiento</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {tratamientosConLanding.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tratamientos/${t.slug}/${provincia}`}
                  className="rounded-full border border-line bg-white px-3 py-1 text-sm font-medium text-teal-dark hover:border-cyan hover:text-cyan"
                >
                  {t.nombre} en {lugar} ({t.n})
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-10">
        {clinicas.length > 0 ? (
          <>
            <div className="flex justify-end">
              <VistaToggle />
            </div>
            <VistaListaMapa
              clinicas={clinicas}
              vista={vista === "mapa" ? "mapa" : "lista"}
              idsDestacados={idsDestacados}
            />
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
