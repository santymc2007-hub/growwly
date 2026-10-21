import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarImpresionesListado } from "@/lib/clinica/registrar-impresiones-listado";
import { ordenarConDestacados } from "@/lib/visibilidad/destacados";
import { ClinicFilters } from "@/components/clinics/clinic-filters";
import { VistaListaMapa, VistaToggle } from "@/components/clinics/vista-lista-mapa";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ordenarTiposNegocio, slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";

export const metadata: Metadata = {
  title: "Compara clínicas capilares en España",
  description:
    "Compara clínicas de injerto capilar, tricología y centros capilares verificados por técnica, precio, opiniones e idiomas. Pide presupuesto gratis.",
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

  // Provincia elegida (directamente, por una ciudad suya o por el filtro
  // Palma/pueblos): decide qué destacados van primero. Sin provincia,
  // los generales. Ver lib/visibilidad/destacados.ts.
  const provinciaElegida =
    provincia ||
    (ciudad ? centros.find((c) => c.ciudad === ciudad)?.provincia : null) ||
    (ubicacion ? centros.find((c) => c.ciudad === "Palma")?.provincia : null) ||
    null;
  const { clinicas: ordenados, idsDestacados } = await ordenarConDestacados(
    filtrados,
    provinciaElegida,
  );
  filtrados.splice(0, filtrados.length, ...ordenados);

  // Registro propio de impresiones (para las estadísticas del centro)
  // — fuera del camino de renderizado para no retrasar la respuesta.
  after(async () => {
    await registrarImpresionesListado(
      createAdminClient(),
      filtrados.map((c) => c.id),
      "listado",
    );
  });

  // Resumen de filtros activos: frase + chips que se quitan con un clic.
  // Con filtros amplios (p. ej. FUE en Palma) casi todo sigue saliendo y
  // en el mismo orden — sin esto parecía que el filtro no hacía nada.
  const actuales: Record<string, string | undefined> = {
    provincia, ciudad, tecnica, tipo, idioma, ubicacion, rating,
    verificado, financiacion, oferta, primera_consulta, vista,
  };
  const sinFiltro = (clave: string) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(actuales)) if (v && k !== clave) q.set(k, v);
    const qs = q.toString();
    return qs ? `/centros?${qs}` : "/centros";
  };
  const chips = [
    tecnica && { clave: "tecnica", texto: `con ${tecnica}` },
    ciudad && { clave: "ciudad", texto: `en ${ciudad}` },
    !ciudad && provincia && { clave: "provincia", texto: `en ${provincia}` },
    ubicacion === "palma" && { clave: "ubicacion", texto: "en Palma" },
    ubicacion === "pueblo" && { clave: "ubicacion", texto: "fuera de Palma" },
    tipo && { clave: "tipo", texto: tipo },
    idioma && { clave: "idioma", texto: `en ${idioma.toLowerCase()}` },
    ratingMinimo && { clave: "rating", texto: `${String(ratingMinimo).replace(".", ",")}★ o más` },
    verificado === "1" && { clave: "verificado", texto: "verificados" },
    financiacion === "1" && { clave: "financiacion", texto: "con financiación" },
    oferta === "1" && { clave: "oferta", texto: "con oferta" },
    primera_consulta === "1" && { clave: "primera_consulta", texto: "1ª consulta gratis" },
  ].filter((c): c is { clave: string; texto: string } => Boolean(c));
  // Cambia con cada combinación de filtros: remonta el listado y vuelve
  // a lanzar la animación de entrada.
  const claveResultados = chips.map((c) => `${c.clave}=${actuales[c.clave]}`).join("&") || "todos";

  const provincias = uniqueSorted(centros.map((c) => c.provincia));
  const ciudades = uniqueSorted(
    centros
      .filter((c) => !provincia || c.provincia === provincia)
      .map((c) => c.ciudad),
  );
  const tecnicas = uniqueSorted(centros.flatMap((c) => c.tecnicas));
  const tipos = ordenarTiposNegocio(uniqueSorted(centros.map((c) => c.tipo_negocio)));

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
          blanco de más abajo. Sticky solo en escritorio (lg): en móvil
          taparía el listado al hacer scroll. El toggle Lista/Mapa vive
          en la cabecera del panel de resultados, no aquí: cambia cómo se
          ven los resultados, no cuáles se muestran. */}
      <div className="relative z-20 mx-auto -mt-12 lg:sticky lg:top-0 max-w-[1400px] px-3 pt-3 sm:-mt-14 sm:px-6 sm:pt-4">
        <div className="rounded-2xl bg-white p-3 shadow-lg sm:p-4 lg:p-5">
          <ClinicFilters
            cabecera={
              <p className="font-display text-sm font-bold text-ink sm:text-lg">
                {filtrados.length}
                {chips.length > 0 && ` de ${centros.length}`}{" "}
                {filtrados.length === 1 ? "centro encontrado" : "centros encontrados"}
              </p>
            }
            provincias={provincias}
            tecnicas={tecnicas}
            tipos={tipos}
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-3 pb-8 pt-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-10">
            {/* Cabecera del panel: ciudades a la izquierda, Lista/Mapa a
                la derecha (en móvil, el toggle va arriba). */}
            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              {ciudades.length > 1 ? (
                <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
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
              ) : (
                <span className="hidden sm:block" />
              )}
              <VistaToggle />
            </div>

            {chips.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2" aria-live="polite">
                <span className="text-sm font-semibold text-teal-dark">
                  {filtrados.length} {filtrados.length === 1 ? "centro" : "centros"}
                </span>
                {chips.map((c) => (
                  <Link
                    key={c.clave + c.texto}
                    href={sinFiltro(c.clave)}
                    scroll={false}
                    className="press inline-flex items-center gap-1.5 rounded-full bg-teal-dark px-3 py-1 text-sm font-medium text-white hover:bg-teal"
                    aria-label={`Quitar filtro: ${c.texto}`}
                  >
                    {c.texto}
                    <span aria-hidden className="text-white/70">×</span>
                  </Link>
                ))}
              </div>
            )}

            <div data-resultados key={claveResultados} className="resultados-entra mt-6 sm:mt-8">
              {filtrados.length > 0 ? (
                <>
                  <VistaListaMapa
                    clinicas={filtrados}
                    vista={vista === "mapa" ? "mapa" : "lista"}
                    idsDestacados={idsDestacados}
                    resaltarTecnica={tecnica}
                  />
                  <p className="mt-6 text-xs text-ink-soft">
                    <Link href="/como-ordenamos" className="underline hover:text-teal-dark">
                      Cómo ordenamos los centros
                    </Link>
                  </p>
                </>
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
