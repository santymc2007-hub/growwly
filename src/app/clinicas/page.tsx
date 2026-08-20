import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ClinicFilters } from "@/components/clinics/clinic-filters";
import { VistaListaMapa } from "@/components/clinics/vista-lista-mapa";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";

export const metadata: Metadata = {
  title: "Clínicas capilares en España",
  description:
    "Directorio de clínicas capilares en España: compara técnicas, precios, valoraciones e idiomas por ciudad.",
  alternates: { canonical: "/clinicas" },
};

type SearchParams = {
  provincia?: string;
  ciudad?: string;
  tecnica?: string;
  idioma?: string;
  ubicacion?: string;
  rating?: string;
  verificado?: string;
  financiacion?: string;
};

export default async function ClinicasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const {
    provincia,
    ciudad,
    tecnica,
    idioma,
    ubicacion,
    rating,
    verificado,
    financiacion,
  } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("publicado", true)
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  const clinicas = data ?? [];

  const ratingMinimo = rating ? Number(rating) : null;

  const filtradas = clinicas.filter((c) => {
    if (provincia && c.provincia !== provincia) return false;
    if (ciudad && c.ciudad !== ciudad) return false;
    if (tecnica && !c.tecnicas.includes(tecnica)) return false;
    if (idioma && !c.idiomas.includes(idioma)) return false;
    if (ubicacion === "palma" && c.ciudad !== "Palma") return false;
    if (ubicacion === "pueblo" && c.ciudad === "Palma") return false;
    if (ratingMinimo && (c.rating_google ?? 0) < ratingMinimo) return false;
    if (verificado === "1" && !c.verificado) return false;
    if (financiacion === "1" && !c.financiacion) return false;
    return true;
  });

  const provincias = uniqueSorted(clinicas.map((c) => c.provincia));
  const ciudades = uniqueSorted(
    clinicas
      .filter((c) => !provincia || c.provincia === provincia)
      .map((c) => c.ciudad),
  );
  const tecnicas = uniqueSorted(clinicas.flatMap((c) => c.tecnicas));

  return (
    <main className="flex-1">
      <header
        className="bg-cover bg-center"
        style={{ backgroundImage: "url(/brand/fondo-hero.png)" }}
      >
        <SiteHeader />
        <div className="mx-auto max-w-[1600px] px-6 py-12">
          <h1 className="font-display text-4xl text-ink sm:text-5xl">
            Clínicas <span className="text-teal-dark">capilares</span> en
            España
          </h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Compara clínicas por ciudad, técnica e idioma antes de pedir cita.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">
            {filtradas.length}{" "}
            {filtradas.length === 1
              ? "clínica encontrada"
              : "clínicas encontradas"}
          </p>
          <ClinicFilters provincias={provincias} ciudades={ciudades} tecnicas={tecnicas} />
        </div>

        {ciudades.length > 1 && (
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
            <span>Explora por ciudad:</span>
            {ciudades.map((c) => {
              const clinicaDeEstaCiudad = clinicas.find((cl) => cl.ciudad === c);
              const provinciaSlug = clinicaDeEstaCiudad
                ? slugifyProvincia(clinicaDeEstaCiudad.provincia)
                : slugifyProvincia("Illes Balears");
              return (
                <Link
                  key={c}
                  href={`/clinicas/${provinciaSlug}/${slugifyCiudad(c)}`}
                  className="text-cyan hover:text-cyan-dark"
                >
                  {c}
                </Link>
              );
            })}
          </p>
        )}

        {filtradas.length > 0 ? (
          <div className="mt-8">
            <VistaListaMapa clinicas={filtradas} />
          </div>
        ) : (
          <div className="mt-16 rounded-3xl border border-dashed border-line bg-paper-dim/50 py-16 text-center">
            <p className="font-display text-xl text-teal-dark">
              Sin resultados
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              No hay clínicas que encajen con estos filtros. Prueba a quitar
              alguno.
            </p>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}
