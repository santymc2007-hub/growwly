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
import { provinciaDesdeSlug, slugifyCiudad } from "@/lib/clinic-options";
import {
  nombreProvinciaBuscable,
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
  const tecnicas = tecnicasMasComunes(centros).join(", ");
  return {
    title: tituloSeo(
      `Clínicas capilares en ${lugar}: ${centros.length} centros`,
      `Clínicas capilares en ${lugar}`,
    ),
    description: metaSeo(
      `Compara ${centros.length} clínicas y centros capilares en ${lugar}.`,
      [tecnicas ? `${tecnicas}.` : null, "Opiniones y ubicación."],
      "Pide presupuesto gratis.",
    ),
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
    <PaginaListado
      migas={[
        { label: "Centros", href: "/centros" },
        { label: lugar, href: `/centros/${provincia}` },
      ]}
      titulo={
        <>
          Clínicas <span className="text-teal-dark">capilares</span> en {lugar}
        </>
      }
      intro={
        clinicas.length === 0
          ? `Todavía no tenemos centros registrados en ${lugar}.`
          : `${clinicas.length} centros capilares en ${lugar}.`
      }
      cabecera={
        ciudades.length > 0 ? (
          <EnlacesEnLinea
            titulo="Explora por ciudad"
            enlaces={ciudades.map((c) => ({
              href: `/centros/${provincia}/${slugifyCiudad(c.ciudad)}`,
              texto: c.ciudad,
            }))}
          />
        ) : undefined
      }
      conResultados={clinicas.length > 0}
      relacionados={[
        {
          titulo: `Tratamientos en ${lugar}`,
          enlaces: tratamientosConLanding.map((t) => ({
            href: `/tratamientos/${t.slug}/${provincia}`,
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
