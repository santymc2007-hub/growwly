import { paraListado } from "@/lib/clinica/para-listado";
import Link from "next/link";
import { after } from "next/server";
import { serializarJsonLd } from "@/lib/json-ld";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarImpresionesListado } from "@/lib/clinica/registrar-impresiones-listado";
import { ordenarConDestacados } from "@/lib/visibilidad/destacados";
import type { BreadcrumbItem } from "@/components/breadcrumbs";
import { VistaListaMapa } from "@/components/clinics/vista-lista-mapa";
import { EnlacesEnLinea, PaginaListado } from "@/components/clinics/pagina-listado";
import { hrefFicha, enFrase, type LugarLanding } from "@/lib/seo/landings";
import { SITE_URL } from "@/lib/site-url";
import { MIN_CENTROS_RANKING } from "@/lib/seo/mejores";
import { slugifyProvincia } from "@/lib/clinic-options";
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
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(itemListJsonLd) }}
      />
      <PaginaListado
        migas={migas}
        titulo={
          <>
            <span className="text-teal-dark">{tratamiento.nombre}</span> en {lugarNombre}
          </>
        }
        intro={
          <>
            {`En Growwly hay ${clinicas.length} centros que ofrecen ${nombreMin} en ${lugarNombre}`}
            {"."}{" "}
            {tratamiento.resumen}{" "}
            <Link
              href={`/tratamientos/${tratamiento.slug}`}
              className="font-medium text-cyan hover:text-cyan-dark"
            >
              Lee la guía completa de {nombreMin} →
            </Link>
            {ciudades && clinicas.length >= MIN_CENTROS_RANKING && (
              <>
                {" "}
                <Link
                  href={`/mejores/${tratamiento.slug}/${slugifyProvincia(provinciaReal)}`}
                  className="font-medium text-cyan hover:text-cyan-dark"
                >
                  Ver el ranking de las mejores →
                </Link>
              </>
            )}
          </>
        }
        cabecera={
          ciudades && ciudades.length > 0 ? (
            <EnlacesEnLinea
              titulo="Por ciudad"
              enlaces={ciudades.map((c) => ({
                href: `${url}/${c.ciudadSlug}`,
                texto: `${c.ciudad} (${c.n})`,
              }))}
            />
          ) : undefined
        }
        conResultados
      >
        <VistaListaMapa
          clinicas={clinicas.map(paraListado)}
          vista={vista === "mapa" ? "mapa" : "lista"}
          idsDestacados={idsDestacados}
        />
      </PaginaListado>
    </>
  );
}
