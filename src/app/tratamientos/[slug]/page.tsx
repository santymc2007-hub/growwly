import { serializarJsonLd } from "@/lib/json-ld";
import { slugActualDesdeAntiguo } from "@/lib/seo/slug-editable";
import Link from "next/link";
import Image from "next/image";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { tituloSeo, textoTitle, metaSeo, primerasFrases, OG_BASE } from "@/lib/seo/meta";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarImpresionesListado } from "@/lib/clinica/registrar-impresiones-listado";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { ClinicCard } from "@/components/clinics/clinic-card";
import { NavTratamientos } from "@/components/tratamientos/nav-tratamientos";
import { ContenidoEnriquecido } from "@/components/contenido-enriquecido";
import { EvidenciaTratamiento } from "@/components/tratamientos/evidencia-tratamiento";
import type { Clinic } from "@/lib/supabase/database.types";
import { ordenarConDestacados } from "@/lib/visibilidad/destacados";
import { getDestinosTratamiento, getDestinosCiudad } from "@/lib/seo/enlaces-internos";
import { postsSobreTratamiento } from "@/lib/seo/relacionados";
import {
  getCentrosConTecnica,
  lugaresConLanding,
  nombreProvinciaBuscable,
  recortar,
  enFrase,
} from "@/lib/seo/landings";
import { BotonCompartir } from "@/components/ui/boton-compartir";

type Params = { slug: string };

// cache(): generateMetadata y la página en sí piden el mismo
// tratamiento por separado — sin esto, la consulta se repite dos
// veces por cada carga. cache() la memoriza para la duración de la
// petición, así la segunda llamada con el mismo slug no vuelve a la
// base de datos.
const findTratamiento = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tratamientos")
    .select("*")
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tratamiento = await findTratamiento(slug);
  if (!tratamiento) return {};
  const centros = tratamiento.tecnica_relacionada
    ? await getCentrosConTecnica(tratamiento.tecnica_relacionada)
    : [];
  const n = centros.length;
  const lugar = centros.length > 0 ? nombreProvinciaBuscable(centros[0].provincia, centros) : null;
  const title = tituloSeo(
    tratamiento.seo_title,
    `${tratamiento.nombre}: qué es, precio y clínicas`,
    `${tratamiento.nombre}: guía y clínicas`,
    `${tratamiento.nombre}: guía completa`,
    tratamiento.nombre,
  );
  const description = metaSeo(
    tratamiento.resumen
      ? primerasFrases(tratamiento.resumen, 120)
      : `Qué es ${enFrase(tratamiento.nombre)}, para quién está indicado, cómo es el proceso y la recuperación.`,
    [
      n > 0 && lugar
        ? `${n} ${n === 1 ? "centro lo ofrece" : "centros lo ofrecen"} en ${lugar}.`
        : null,
    ],
    "Guía clara y sin letra pequeña.",
  );
  return {
    title,
    description,
    alternates: { canonical: `/tratamientos/${tratamiento.slug}` },
    openGraph: {
      ...OG_BASE,
      url: `/tratamientos/${tratamiento.slug}`,
      title: textoTitle(title),
      description,
      images: tratamiento.imagen_portada ? [tratamiento.imagen_portada] : OG_BASE.images,
    },
  };
}

export default async function TratamientoPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const tratamiento = await findTratamiento(slug);

  if (!tratamiento) {
    const nuevo = await slugActualDesdeAntiguo("tratamientos", slug);
    if (nuevo) permanentRedirect(`/tratamientos/${nuevo}`);
    notFound();
  }

  const supabase = await createClient();

  // Clínicas y precios reales que ofrecen esta técnica — nunca cifras
  // inventadas sobre el tratamiento. Independiente del nav de la
  // derecha, así que las dos consultas van en paralelo.
  const [clinicasData, { data: todosTratamientos }, destinosTratamiento, destinosCiudad] =
    await Promise.all([
      tratamiento.tecnica_relacionada
        ? getCentrosConTecnica(tratamiento.tecnica_relacionada)
        : Promise.resolve([] as Clinic[]),
      // Para el nav de "todos los tratamientos" del sidebar.
      supabase
        .from("tratamientos")
        .select("slug, nombre, categoria")
        .eq("publicado", true)
        .order("nombre", { ascending: true }),
      getDestinosTratamiento(),
      getDestinosCiudad(),
    ]);

  const hrefPropio = `/tratamientos/${tratamiento.slug}`;
  const destinoPropio = destinosTratamiento.find((d) => d.href === hrefPropio);
  const guias = destinoPropio ? await postsSobreTratamiento(destinoPropio) : [];
  const lugares = lugaresConLanding(clinicasData);
  const ciudadesConCentros = new Set(clinicasData.map((c) => c.ciudad).filter(Boolean)).size;
  const actualizado = new Date(tratamiento.updated_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // A dónde lleva "Ver centros": la landing de la provincia si existe
  // (URL indexable), si no el listado filtrado.
  const hrefCentros =
    lugares.length === 1
      ? `/tratamientos/${tratamiento.slug}/${lugares[0].provinciaSlug}`
      : tratamiento.tecnica_relacionada
        ? `/centros?tecnica=${encodeURIComponent(tratamiento.tecnica_relacionada)}`
        : "/centros";

  // Sin provincia elegida: primero los destacados generales que
  // ofrecen esta técnica, el resto por Growwly Score; se muestran 6.
  const { clinicas: ordenadasTecnica, idsDestacados } = await ordenarConDestacados(
    clinicasData,
    null,
  );
  const clinicasConTecnica = ordenadasTecnica.slice(0, 6);

  after(async () => {
    await registrarImpresionesListado(
      createAdminClient(),
      clinicasConTecnica.map((c) => c.id),
      "tratamiento",
    );
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es";

  const faqs = Array.isArray(tratamiento.preguntas_frecuentes)
    ? (tratamiento.preguntas_frecuentes as { pregunta: string; respuesta: string }[])
    : [];

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: tratamiento.nombre,
    description: tratamiento.resumen ?? undefined,
    url: `${siteUrl}/tratamientos/${tratamiento.slug}`,
    serviceType: "Tratamiento capilar",
    areaServed: "ES",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tratamientos",
        item: `${siteUrl}/tratamientos`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tratamiento.nombre,
        item: `${siteUrl}/tratamientos/${tratamiento.slug}`,
      },
    ],
  };

  const faqJsonLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.pregunta,
            acceptedAnswer: { "@type": "Answer", text: f.respuesta },
          })),
        }
      : null;

  return (
    <main className="relative flex-1">
      <FondoTextura />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: serializarJsonLd(faqJsonLd) }}
        />
      )}
      <SiteHeader />

      <article className="mx-auto max-w-[1400px] px-3 pb-8 pt-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-10">
            <div className="lg:flex lg:items-start lg:gap-10">
              <div className="lg:min-w-0 lg:flex-1 lg:[&>*:not(:first-child)]:max-w-3xl">
                {/* Foto: en móvil a sangre arriba de la tarjeta; en escritorio,
                    del mismo ancho que el texto. */}
              {tratamiento.imagen_portada ? (
                <div className="relative -mx-6 -mt-8 mb-6 aspect-[2/1] bg-sage sm:-mx-10 sm:aspect-[21/7] lg:mx-0 lg:mt-0 lg:aspect-[21/9] lg:overflow-hidden lg:rounded-2xl">
                  <Image
                    src={tratamiento.imagen_portada}
                    alt={tratamiento.nombre}
                    fill
                    sizes="(min-width: 1024px) 900px, 100vw"
                    priority
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="-mx-6 -mt-8 mb-6 flex aspect-[2/1] items-center justify-center bg-gradient-to-br from-brand-green to-brand-blue sm:-mx-10 sm:aspect-[21/7] lg:mx-0 lg:mt-0 lg:aspect-[21/9] lg:rounded-2xl">
                  <span className="font-display text-2xl font-bold text-white">
                    {tratamiento.nombre}
                  </span>
                </div>
              )}
                <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-sm text-ink-soft">
                  <Link href="/tratamientos" className="hover:text-cyan">
                    Tratamientos
                  </Link>
                  <span aria-hidden>/</span>
                  <span className="text-ink">{tratamiento.nombre}</span>
                </nav>

                <h1 className="mt-3 font-display text-3xl text-teal-dark sm:text-4xl">
                  {tratamiento.nombre}
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-soft">
                    Actualizado el <time dateTime={tratamiento.updated_at}>{actualizado}</time>
                  </p>
                  <BotonCompartir titulo={`${tratamiento.nombre}: qué es, precios y centros`} tipo="tratamiento" />
                </div>

                {/* Datos clave: lo que más citan los buscadores con IA.
                    Solo datos reales; si no hay, no se muestra la casilla. */}
                <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-paper-dim p-4">
                    <dt className="text-xs text-ink-soft">Centros</dt>
                    <dd className="mt-1 font-display text-2xl text-teal-dark">{clinicasData.length}</dd>
                  </div>
                  {ciudadesConCentros > 0 && (
                    <div className="rounded-2xl bg-paper-dim p-4">
                      <dt className="text-xs text-ink-soft">Ciudades</dt>
                      <dd className="mt-1 font-display text-2xl text-teal-dark">{ciudadesConCentros}</dd>
                    </div>
                  )}
                  {tratamiento.duracion_orientativa && (
                    <div className="rounded-2xl bg-paper-dim p-4">
                      <dt className="text-xs text-ink-soft">Duración orientativa</dt>
                      <dd className="mt-1 text-sm font-semibold text-teal-dark">
                        {tratamiento.duracion_orientativa}
                      </dd>
                    </div>
                  )}
                </dl>

                <EvidenciaTratamiento tratamiento={tratamiento} />

                <ContenidoEnriquecido
                  contenido={tratamiento.contenido}
                  enlaces={[...destinosTratamiento, ...destinosCiudad]}
                  excluirHref={hrefPropio}
                />

                {faqs.length > 0 && (
                  <section className="mt-10">
                    <h2 className="font-display text-xl text-teal-dark">
                      Preguntas frecuentes
                    </h2>
                    <div className="mt-4 flex flex-col gap-3">
                      {faqs.map((f, i) => (
                        <details
                          key={i}
                          className="rounded-lg border border-line bg-white p-4"
                        >
                          <summary className="cursor-pointer font-medium text-ink">
                            {f.pregunta}
                          </summary>
                          <p className="mt-2 text-sm text-ink-soft">{f.respuesta}</p>
                        </details>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="mt-8 flex flex-col gap-4 lg:sticky lg:top-8 lg:ml-auto lg:mt-0 lg:w-[360px] lg:shrink-0 lg:rounded-3xl lg:bg-paper-dim lg:p-5">
                {tratamiento.tecnica_relacionada && (
                  <Link
                    href={hrefCentros}
                    className="press block rounded-full bg-yellow px-5 py-3 text-center text-sm font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
                  >
                    Ver centros con esta técnica
                  </Link>
                )}
                {lugares.length > 0 && (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <p className="font-display text-lg text-teal-dark">
                      Dónde hacerte {enFrase(tratamiento.nombre)}
                    </p>
                    <ul className="mt-3 flex flex-col gap-2 text-sm">
                      {lugares.map((l) => (
                        <li key={l.provinciaSlug}>
                          <Link
                            href={`/tratamientos/${tratamiento.slug}/${l.provinciaSlug}`}
                            className="font-medium text-cyan hover:text-cyan-dark"
                          >
                            {tratamiento.nombre} en {nombreProvinciaBuscable(l.provincia, clinicasData.filter((c) => c.provincia === l.provincia))} ({l.n})
                          </Link>
                          {l.ciudades.length > 0 && (
                            <ul className="mt-1 flex flex-col gap-1 pl-3">
                              {l.ciudades.map((c) => (
                                <li key={c.ciudadSlug}>
                                  <Link
                                    href={`/tratamientos/${tratamiento.slug}/${l.provinciaSlug}/${c.ciudadSlug}`}
                                    className="text-ink-soft hover:text-cyan"
                                  >
                                    {c.ciudad} ({c.n})
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <NavTratamientos
                  tratamientos={todosTratamientos ?? []}
                  activoSlug={tratamiento.slug}
                />
              </aside>
            </div>

            {clinicasConTecnica.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-xl text-teal-dark">
                  Centros que ofrecen {enFrase(tratamiento.nombre)}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {clinicasConTecnica.map((c) => (
                    <ClinicCard key={c.id} clinic={c} destacado={idsDestacados.includes(c.id)} />
                  ))}
                </div>
                {tratamiento.tecnica_relacionada && (
                  <Link
                    href={hrefCentros}
                    className="mt-4 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
                  >
                    Ver todos los centros con esta técnica →
                  </Link>
                )}
              </section>
            )}

            {guias.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-xl text-teal-dark">Guías relacionadas</h2>
                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {guias.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/blog/${g.slug}`}
                      className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:border-teal/40 hover:shadow-md"
                    >
                      {g.imagen_portada && (
                        <div className="relative aspect-[16/9] w-full bg-sage">
                          <Image
                            src={g.imagen_portada}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 33vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-display text-base text-teal-dark group-hover:text-cyan">
                          {g.titulo}
                        </p>
                        {g.resumen && (
                          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{g.resumen}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
