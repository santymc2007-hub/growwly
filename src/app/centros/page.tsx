import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarImpresionesListado } from "@/lib/clinica/registrar-impresiones-listado";
import { calcularGrowwlyScore } from "@/lib/leads/growwly-score";
import { calcularMetricasLeadsClinicas } from "@/lib/leads/metricas-clinica";
import { ClinicFilters } from "@/components/clinics/clinic-filters";
import { VistaListaMapa, VistaToggle } from "@/components/clinics/vista-lista-mapa";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";

export const metadata: Metadata = {
  title: "Centros capilares en España",
  description:
    "Directorio de centros capilares en España: compara clínicas, centros de injertos y centros estéticos por técnica, precios, valoraciones e idiomas por ciudad.",
  alternates: { canonical: "/centros" },
};

type SearchParams = {
  provincia?: string;
  ciudad?: string;
  tecnica?: string;
  tipo?: string;
  idioma?: string;
  ubicacion?: string;
  rating?: string;
  verificado?: string;
  financiacion?: string;
  oferta?: string;
  primera_consulta?: string;
  vista?: string;
};

export default async function CentrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const {
    provincia,
    ciudad,
    tecnica,
    tipo,
    idioma,
    ubicacion,
    rating,
    verificado,
    financiacion,
    oferta,
    primera_consulta,
    vista,
  } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .eq("publicado", true)
    .eq("verificado_admin", true)
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  const centros = data ?? [];

  const ratingMinimo = rating ? Number(rating) : null;

  const filtrados = centros.filter((c) => {
    if (provincia && c.provincia !== provincia) return false;
    if (ciudad && c.ciudad !== ciudad) return false;
    if (tecnica && !c.tecnicas.includes(tecnica)) return false;
    if (tipo && c.tipo_negocio !== tipo) return false;
    if (idioma && !c.idiomas.includes(idioma)) return false;
    if (ubicacion === "palma" && c.ciudad !== "Palma") return false;
    if (ubicacion === "pueblo" && c.ciudad === "Palma") return false;
    if (ratingMinimo && (c.rating_google ?? 0) < ratingMinimo) return false;
    if (verificado === "1" && !c.verificado) return false;
    if (financiacion === "1" && !c.financiacion) return false;
    // La oferta solo cuenta si de verdad se va a ver en la ficha — una
    // clínica Básica puede tener tiene_oferta guardado de cuando era
    // premium, pero no se le muestra al visitante (ver clinic-badges.tsx).
    if (oferta === "1" && !(c.plan === "premium" && c.tiene_oferta)) return false;
    if (primera_consulta === "1" && !c.primera_consulta_gratis) return false;
    return true;
  });

  // Mientras no haya ninguna clínica destacada (hueco premium todavía
  // sin vender), el orden por defecto ("orden" a mano + nombre) no dice
  // nada sobre calidad — se sustituye por el Growwly Score, que sí
  // premia perfil completo, rapidez de respuesta y buena gestión de
  // leads. En cuanto haya al menos una destacada, esa pasa a mandar y
  // el resto mantiene el orden manual de siempre (no se recalcula el
  // score de todo el listado en cada visita sin necesidad).
  if (filtrados.length > 0 && !filtrados.some((c) => c.destacado)) {
    const metricas = await calcularMetricasLeadsClinicas(
      createAdminClient(),
      filtrados.map((c) => c.id),
    );
    const metricasVacias = { tiempoRespuestaPromedioMinutos: null, tasaGestionLeads: null };
    const puntuados = filtrados.map((c) => ({
      clinic: c,
      score: calcularGrowwlyScore(c, metricas.get(c.id) ?? metricasVacias).total,
    }));
    puntuados.sort(
      (a, b) => b.score - a.score || a.clinic.nombre.localeCompare(b.clinic.nombre, "es"),
    );
    filtrados.splice(0, filtrados.length, ...puntuados.map((p) => p.clinic));
  }

  // Registro propio de impresiones (para las estadísticas del centro)
  // — fuera del camino de renderizado para no retrasar la respuesta.
  after(async () => {
    await registrarImpresionesListado(
      createAdminClient(),
      filtrados.map((c) => c.id),
      "listado",
    );
  });

  const provincias = uniqueSorted(centros.map((c) => c.provincia));
  const ciudades = uniqueSorted(
    centros
      .filter((c) => !provincia || c.provincia === provincia)
      .map((c) => c.ciudad),
  );
  const tecnicas = uniqueSorted(centros.flatMap((c) => c.tecnicas));
  const tipos = uniqueSorted(centros.map((c) => c.tipo_negocio));

  return (
    <main className="relative flex-1">
      <FondoTextura />
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-8 sm:pb-24">
        <Breadcrumbs items={[{ label: "Centros", href: "/centros" }]} />

        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
          Centros <span className="text-teal-dark">capilares</span> en
          España
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Compara centros por ciudad, tipo, técnica e idioma antes de pedir
          cita.
        </p>
      </div>

      {/* Barra de filtros flotante: a caballo entre el fondo y el panel
          blanco de más abajo, como una tarjeta elevada. Sticky para que
          se pueda seguir filtrando/cambiando de vista sin tener que
          volver arriba al bajar por el listado. */}
      <div className="sticky top-0 z-20 mx-auto -mt-12 max-w-[1400px] px-3 pt-3 sm:-mt-14 sm:px-6 sm:pt-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-lg lg:flex-row lg:items-center lg:justify-between lg:p-5">
          <p className="text-sm text-ink-soft">
            {filtrados.length}{" "}
            {filtrados.length === 1
              ? "centro encontrado"
              : "centros encontrados"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ClinicFilters
              provincias={provincias}
              tecnicas={tecnicas}
              tipos={tipos}
            />
            <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />
            <VistaToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-3 pb-8 pt-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-10">
            {ciudades.length > 1 && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
                <span>Explora por ciudad:</span>
                {ciudades.map((c) => {
                  const centroDeEstaCiudad = centros.find((cl) => cl.ciudad === c);
                  const provinciaSlug = centroDeEstaCiudad
                    ? slugifyProvincia(centroDeEstaCiudad.provincia)
                    : slugifyProvincia("Illes Balears");
                  return (
                    <Link
                      key={c}
                      href={`/centros/${provinciaSlug}/${slugifyCiudad(c)}`}
                      className="text-cyan hover:text-cyan-dark"
                    >
                      {c}
                    </Link>
                  );
                })}
              </p>
            )}

            <div className={ciudades.length > 1 ? "mt-8" : undefined}>
              {filtrados.length > 0 ? (
                <VistaListaMapa
                  clinicas={filtrados}
                  vista={vista === "mapa" ? "mapa" : "lista"}
                />
              ) : (
                <div className="rounded-3xl border border-dashed border-line bg-paper-dim/50 py-16 text-center">
                  <p className="font-display text-xl text-teal-dark">
                    Sin resultados
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    No hay centros que encajen con estos filtros. Prueba a
                    quitar alguno.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
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
