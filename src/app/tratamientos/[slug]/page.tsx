import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClinicCard } from "@/components/clinics/clinic-card";
import { formatearPrecio } from "@/lib/clinic-options";
import type { Clinic } from "@/lib/supabase/database.types";

type Params = { slug: string };

async function findTratamiento(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tratamientos")
    .select("*")
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tratamiento = await findTratamiento(slug);
  if (!tratamiento) return {};
  return {
    title: tratamiento.nombre,
    description: tratamiento.resumen ?? undefined,
    alternates: { canonical: `/tratamientos/${tratamiento.slug}` },
    openGraph: {
      title: tratamiento.nombre,
      description: tratamiento.resumen ?? undefined,
      images: tratamiento.imagen_portada ? [tratamiento.imagen_portada] : undefined,
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
    notFound();
  }

  const supabase = await createClient();

  // Clínicas y precios reales que ofrecen esta técnica — nunca cifras
  // inventadas sobre el tratamiento.
  let clinicasConTecnica: Clinic[] = [];
  let precioMin: number | null = null;
  let precioMax: number | null = null;

  if (tratamiento.tecnica_relacionada) {
    const { data } = await supabase
      .from("clinics")
      .select("*")
      .eq("publicado", true)
      .contains("tecnicas", [tratamiento.tecnica_relacionada])
      .order("destacado", { ascending: false })
      .order("orden", { ascending: true })
      .limit(6);
    clinicasConTecnica = data ?? [];

    const desde = clinicasConTecnica
      .map((c) => c.precio_desde)
      .filter((p): p is number => p !== null);
    const hasta = clinicasConTecnica
      .map((c) => c.precio_hasta)
      .filter((p): p is number => p !== null);
    precioMin = desde.length > 0 ? Math.min(...desde) : null;
    precioMax = hasta.length > 0 ? Math.max(...hasta) : null;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";

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
    ...(precioMin !== null && {
      offers: {
        "@type": "Offer",
        priceCurrency: "EUR",
        price: precioMin,
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: precioMin,
          maxPrice: precioMax ?? undefined,
          priceCurrency: "EUR",
        },
      },
    }),
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
    <main className="flex-1">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <SiteHeader />

      <article className="mx-auto max-w-[1600px] px-6 py-12">
        <div className="lg:flex lg:items-start lg:gap-10">
          <div className="lg:max-w-2xl lg:flex-1">
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
            {tratamiento.duracion_orientativa && (
              <p className="mt-2 text-sm text-ink-soft">
                Duración orientativa: {tratamiento.duracion_orientativa}
              </p>
            )}

            <div className="prose prose-teal mt-8 max-w-none prose-headings:font-display prose-headings:text-teal-dark prose-a:text-cyan">
              <ReactMarkdown>{tratamiento.contenido}</ReactMarkdown>
            </div>

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

          <aside className="mt-8 lg:sticky lg:top-8 lg:mt-0 lg:w-[360px] lg:shrink-0">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              {tratamiento.imagen_portada ? (
                <div className="relative aspect-[4/3] w-full bg-sage">
                  <Image
                    src={tratamiento.imagen_portada}
                    alt={tratamiento.nombre}
                    fill
                    sizes="360px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-brand-green to-brand-blue">
                  <span className="font-display text-lg font-bold text-white">
                    {tratamiento.nombre}
                  </span>
                </div>
              )}
              <div className="p-5">
                {(precioMin !== null || precioMax !== null) && (
                  <p className="inline-block rounded-full bg-sage px-4 py-1.5 text-sm font-medium text-sage-ink">
                    {precioMin !== null && precioMax !== null
                      ? `${formatearPrecio(precioMin)} - ${formatearPrecio(precioMax)}`
                      : precioMin !== null
                        ? `desde ${formatearPrecio(precioMin)}`
                        : `hasta ${formatearPrecio(precioMax!)}`}
                  </p>
                )}
                <p className="mt-2 text-xs text-ink-soft">
                  Precio orientativo en el directorio — cada clínica confirma
                  el suyo en su presupuesto.
                </p>
                {tratamiento.tecnica_relacionada && (
                  <Link
                    href={`/clinicas?tecnica=${encodeURIComponent(tratamiento.tecnica_relacionada)}`}
                    className="press mt-4 block rounded-full bg-gradient-to-r from-yellow to-orange px-5 py-2.5 text-center text-sm font-bold text-teal-dark shadow-sm shadow-orange/20 transition hover:opacity-90"
                  >
                    Ver clínicas con esta técnica
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>

        {clinicasConTecnica.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl text-teal-dark">
              Clínicas que ofrecen {tratamiento.nombre.toLowerCase()}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {clinicasConTecnica.map((c) => (
                <ClinicCard key={c.id} clinic={c} />
              ))}
            </div>
            {tratamiento.tecnica_relacionada && (
              <Link
                href={`/clinicas?tecnica=${encodeURIComponent(tratamiento.tecnica_relacionada)}`}
                className="mt-4 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
              >
                Ver todas las clínicas con esta técnica →
              </Link>
            )}
          </section>
        )}
      </article>
      <SiteFooter />
    </main>
  );
}
