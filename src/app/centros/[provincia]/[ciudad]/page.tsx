import { paraListado } from "@/lib/clinica/para-listado";
import { cache } from "react";
import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { tituloSeo, textoTitle, metaSeo, primerasFrases } from "@/lib/seo/meta";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarImpresionesListado } from "@/lib/clinica/registrar-impresiones-listado";
import { VistaListaMapa } from "@/components/clinics/vista-lista-mapa";
import { EnlacesEnLinea, PaginaListado, SinCentros } from "@/components/clinics/pagina-listado";
import { ordenarConDestacados } from "@/lib/visibilidad/destacados";
import {
  provinciaDesdeSlug,
  municipioDesdeSlugGenerico,
  slugifyCiudad,
} from "@/lib/clinic-options";
import {
  nombreCiudadBuscable,
  recortar,
  tecnicasMasComunes,
  MIN_CENTROS_LANDING,
} from "@/lib/seo/landings";

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
    .order("nombre", { ascending: true });

  const todas = data ?? [];
  // La ciudad real se resuelve a partir de lo que ya hay cargado para
  // esta provincia — así funciona para cualquier provincia sin
  // necesitar un callejero completo de toda España.
  const ciudadesDeProvincia = Array.from(
    new Set(todas.map((c) => c.ciudad).filter((c): c is string => Boolean(c))),
  );
  const ciudadReal = municipioDesdeSlugGenerico(ciudadSlug, ciudadesDeProvincia);
  if (!ciudadReal)
    return { ciudadReal: null, clinicas: [], idsDestacados: [] as string[], otrasCiudades: [] };

  // La página de una ciudad es una búsqueda en su provincia: primero
  // los destacados de la provincia que estén en esta ciudad, y el resto
  // por Growwly Score (lib/visibilidad/destacados.ts).
  const { clinicas, idsDestacados } = await ordenarConDestacados(
    todas.filter((c) => c.ciudad === ciudadReal),
    provinciaReal,
  );
  const otrasCiudades = ciudadesDeProvincia
    .filter((c) => c !== ciudadReal)
    .sort((a, b) => a.localeCompare(b, "es"));
  return { ciudadReal, clinicas, idsDestacados, otrasCiudades };
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

  const { clinicas } = await getClinicasDeCiudad(provinciaReal, ciudad);
  const lugar = nombreCiudadBuscable(ciudadReal, provinciaReal);
  const tecnicas = tecnicasMasComunes(clinicas).join(", ");
  return {
    title: tituloSeo(
      clinicas.length > 1 && `Clínicas capilares en ${ciudadReal}: ${clinicas.length} centros`,
      `Clínicas capilares en ${ciudadReal}`,
    ),
    description: metaSeo(
      clinicas.length === 1
        ? `Centro capilar verificado en ${lugar}: técnicas, precios y opiniones.`
        : `Compara ${clinicas.length} clínicas y centros capilares verificados en ${lugar}.`,
      [tecnicas ? `${tecnicas}.` : null, "Opiniones y ubicación."],
      "Pide presupuesto gratis.",
    ),
    alternates: { canonical: `/centros/${provincia}/${ciudad}` },
    ...(clinicas.length === 0 && { robots: { index: false, follow: true } }),
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

  const { ciudadReal, clinicas, idsDestacados, otrasCiudades } = await getClinicasDeCiudad(
    provinciaReal,
    ciudad,
  );

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

  const zonas = Array.from(
    new Set(clinicas.map((c) => c.zona).filter((z): z is string => Boolean(z))),
  );

  // Tratamientos con landing en esta ciudad (≥2 centros que lo ofrecen).
  const { data: tratamientosData } = await (await createClient())
    .from("tratamientos")
    .select("slug, nombre, tecnica_relacionada")
    .eq("publicado", true)
    .not("tecnica_relacionada", "is", null)
    .order("nombre");
  const tratamientosCiudad = (tratamientosData ?? [])
    .map((t) => ({
      slug: t.slug,
      nombre: t.nombre,
      n: clinicas.filter((c) => c.tecnicas.includes(t.tecnica_relacionada as string)).length,
    }))
    .filter((t) => t.n >= MIN_CENTROS_LANDING);

  const intro =
    clinicas.length === 0
      ? `Todavía no tenemos centros registrados en ${ciudadReal}. Echa un vistazo al resto del directorio mientras tanto.`
      : `${clinicas.length === 1 ? "Encontrado" : "Encontrados"} ${clinicas.length} ${clinicas.length === 1 ? "centro" : "centros"} en ${ciudadReal}` +
        (zonas.length > 0 ? `. Zonas: ${zonas.join(", ")}.` : ".");

  return (
    <PaginaListado
      migas={[
        { label: "Centros", href: "/centros" },
        { label: provinciaReal, href: `/centros/${provincia}` },
        { label: ciudadReal, href: `/centros/${provincia}/${ciudad}` },
      ]}
      titulo={
        <>
          Centros <span className="text-teal-dark">capilares</span> en {ciudadReal}
        </>
      }
      intro={intro}
      cabecera={
        otrasCiudades.length > 0 ? (
          <EnlacesEnLinea
            titulo="Otras ciudades"
            enlaces={otrasCiudades.map((c) => ({
              href: `/centros/${provincia}/${slugifyCiudad(c)}`,
              texto: c,
            }))}
          />
        ) : undefined
      }
      conResultados={clinicas.length > 0}
      relacionados={[
        {
          titulo: `Tratamientos en ${ciudadReal}`,
          enlaces: tratamientosCiudad.map((t) => ({
            href: `/tratamientos/${t.slug}/${provincia}/${ciudad}`,
            texto: `${t.nombre} (${t.n})`,
          })),
        },
      ]}
    >
      {clinicas.length > 0 ? (
        <VistaListaMapa
          clinicas={clinicas.map(paraListado)}
          vista={vista === "mapa" ? "mapa" : "lista"}
          idsDestacados={idsDestacados}
        />
      ) : (
        <SinCentros />
      )}
    </PaginaListado>
  );
}
