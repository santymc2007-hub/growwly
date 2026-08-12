import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSocialLinks } from "@/lib/social-links";
import { formatearPrecio, slugifyCiudad } from "@/lib/clinic-options";
import { VerifiedBadge } from "@/components/clinics/verified-badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Params = { ciudad: string; slug: string };

async function findClinic(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
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
  const clinic = await findClinic(slug);
  if (!clinic) return {};

  const descripcion =
    clinic.descripcion ??
    `Información, técnicas, idiomas y contacto de ${clinic.nombre}${
      clinic.ciudad ? ` en ${clinic.ciudad}` : ""
    }.`;

  const ciudadSlug = clinic.ciudad ? slugifyCiudad(clinic.ciudad) : "clinica";

  return {
    title: `${clinic.nombre}${clinic.ciudad ? ` en ${clinic.ciudad}` : ""}`,
    description: descripcion,
    alternates: { canonical: `/clinicas/${ciudadSlug}/${clinic.slug}` },
    openGraph: {
      title: clinic.nombre,
      description: descripcion,
      images: clinic.fotos.length > 0 ? [clinic.fotos[0]] : undefined,
    },
  };
}

export default async function ClinicaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { ciudad, slug } = await params;
  const clinic = await findClinic(slug);

  if (!clinic) {
    notFound();
  }

  // La ciudad de la URL debe coincidir con la ciudad real de la clínica —
  // si no, redirige a la URL correcta (evita contenido duplicado y
  // corrige enlaces desactualizados).
  const ciudadSlugReal = clinic.ciudad ? slugifyCiudad(clinic.ciudad) : null;
  if (ciudadSlugReal && ciudad !== ciudadSlugReal) {
    redirect(`/clinicas/${ciudadSlugReal}/${clinic.slug}`);
  }

  const esPremium = clinic.plan === "premium";

  const supabase = await createClient();
  const { data: tratamientosPublicados } = await supabase
    .from("tratamientos")
    .select("slug, tecnica_relacionada")
    .eq("publicado", true)
    .not("tecnica_relacionada", "is", null);
  const tratamientoSlugPorTecnica = new Map(
    (tratamientosPublicados ?? []).map((t) => [t.tecnica_relacionada as string, t.slug]),
  );

  const ubicacion = [
    clinic.zona,
    clinic.ciudad,
    clinic.provincia,
    clinic.comunidad_autonoma,
  ]
    .filter(Boolean)
    .join(", ");

  const socialLinks = getSocialLinks(clinic.redes_sociales);
  const [portada, ...resto] = clinic.fotos;
  const actualizado = new Date(clinic.updated_at).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: clinic.nombre,
    description: clinic.descripcion ?? undefined,
    url: `${siteUrl}/clinicas/${ciudad}/${clinic.slug}`,
    image: clinic.fotos.length > 0 ? clinic.fotos : undefined,
    telephone: esPremium ? (clinic.telefono ?? undefined) : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: esPremium ? (clinic.direccion ?? undefined) : undefined,
      addressLocality: clinic.ciudad ?? undefined,
      addressRegion: clinic.comunidad_autonoma ?? undefined,
      addressCountry: "ES",
    },
    ...(clinic.lat != null &&
      clinic.lng != null && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: clinic.lat,
          longitude: clinic.lng,
        },
      }),
    ...(clinic.rating_google != null &&
      clinic.resenas_google != null && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: clinic.rating_google,
          reviewCount: clinic.resenas_google,
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
        name: "Clínicas",
        item: `${siteUrl}/clinicas`,
      },
      ...(clinic.ciudad
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: clinic.ciudad,
              item: `${siteUrl}/clinicas/${ciudad}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: clinic.ciudad ? 4 : 3,
        name: clinic.nombre,
        item: `${siteUrl}/clinicas/${ciudad}/${clinic.slug}`,
      },
    ],
  };

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />

      <div className="mx-auto max-w-[1600px] px-6 pt-8">
        <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
          <Link href="/clinicas" className="hover:text-cyan">
            Clínicas
          </Link>
          {clinic.ciudad && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/clinicas/${ciudad}`} className="hover:text-cyan">
                {clinic.ciudad}
              </Link>
            </>
          )}
          <span aria-hidden>/</span>
          <span className="text-ink">{clinic.nombre}</span>
        </nav>
      </div>

      <div className="mx-auto mt-4 max-w-[1600px] px-6">
        {portada ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-sage">
            <Image
              src={portada}
              alt={clinic.nombre}
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center rounded-3xl bg-sage text-sage-ink">
            Sin fotos todavía
          </div>
        )}

        {resto.length > 0 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {resto.map((foto, i) => (
              <div
                key={foto}
                className="relative h-20 w-28 flex-none overflow-hidden rounded-lg bg-sage"
              >
                <Image
                  src={foto}
                  alt={`${clinic.nombre} foto ${i + 2}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl text-teal-dark">
                {clinic.nombre}
              </h1>
              {ubicacion && <p className="mt-1 text-ink-soft">{ubicacion}</p>}
              {clinic.tipo_negocio && (
                <p className="mt-1 text-xs uppercase tracking-wide text-ink-soft/70">
                  {clinic.tipo_negocio}
                </p>
              )}
            </div>
            {clinic.verificado && <VerifiedBadge />}
          </div>

          {(clinic.rating_google != null || clinic.rating_doctoralia != null) && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
              {clinic.rating_google != null && (
                <span>
                  <strong className="text-ink">★ {clinic.rating_google.toFixed(1)}</strong>{" "}
                  Google
                  {clinic.resenas_google != null && ` (${clinic.resenas_google} reseñas)`}
                </span>
              )}
              {clinic.rating_doctoralia != null && (
                <span>
                  <strong className="text-ink">★ {clinic.rating_doctoralia.toFixed(1)}</strong>{" "}
                  Doctoralia
                  {clinic.resenas_doctoralia != null &&
                    ` (${clinic.resenas_doctoralia} reseñas)`}
                </span>
              )}
            </div>
          )}

          {clinic.descripcion && (
            <p className="mt-6 text-ink-soft">{clinic.descripcion}</p>
          )}

          {clinic.tecnicas.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg text-teal-dark">
                Técnicas
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {clinic.tecnicas.map((tecnica) =>
                  tratamientoSlugPorTecnica.has(tecnica) ? (
                    <Link
                      key={tecnica}
                      href={`/tratamientos/${tratamientoSlugPorTecnica.get(tecnica)}`}
                      className="rounded-full bg-sage px-3 py-1 text-sm font-medium text-sage-ink hover:bg-cyan hover:text-white"
                    >
                      {tecnica}
                    </Link>
                  ) : (
                    <span
                      key={tecnica}
                      className="rounded-full bg-sage px-3 py-1 text-sm font-medium text-sage-ink"
                    >
                      {tecnica}
                    </span>
                  ),
                )}
              </div>
            </section>
          )}

          {esPremium && clinic.servicios_adicionales.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg text-teal-dark">
                Otros servicios
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {clinic.servicios_adicionales.map((servicio) => (
                  <span
                    key={servicio}
                    className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft"
                  >
                    {servicio}
                  </span>
                ))}
              </div>
            </section>
          )}

          {clinic.idiomas.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg text-teal-dark">
                Idiomas
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {clinic.idiomas.map((idioma) => (
                  <span
                    key={idioma}
                    className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft"
                  >
                    {idioma}
                  </span>
                ))}
              </div>
            </section>
          )}

          {(clinic.primera_consulta_gratis ||
            clinic.financiacion ||
            (esPremium && clinic.tiene_oferta)) && (
            <section className="mt-8 flex flex-wrap gap-3 text-sm">
              {esPremium && clinic.tiene_oferta && (
                <span className="rounded-full bg-cyan px-3 py-1 font-medium text-white">
                  {clinic.detalle_oferta || "Oferta activa"}
                </span>
              )}
              {clinic.primera_consulta_gratis && (
                <span className="rounded-full border border-line px-3 py-1 text-ink-soft">
                  1ª consulta gratis
                </span>
              )}
              {clinic.financiacion && (
                <span className="rounded-full border border-line px-3 py-1 text-ink-soft">
                  Financiación disponible
                </span>
              )}
            </section>
          )}

          {esPremium && Array.isArray(clinic.fotos_antes_despues) && clinic.fotos_antes_despues.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg text-teal-dark">
                Antes y después
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(clinic.fotos_antes_despues as { antes: string; despues: string }[]).map(
                  (par, i) => (
                    <div key={i} className="grid grid-cols-2 gap-1.5">
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-sage">
                        <Image
                          src={par.antes}
                          alt={`${clinic.nombre} antes ${i + 1}`}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-ink/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Antes
                        </span>
                      </div>
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-sage">
                        <Image
                          src={par.despues}
                          alt={`${clinic.nombre} después ${i + 1}`}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-ink/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Después
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {esPremium && Array.isArray(clinic.opiniones) && clinic.opiniones.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg text-teal-dark">
                Opiniones de pacientes
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {(clinic.opiniones as { autor: string; texto: string }[]).map(
                  (opinion, i) => (
                    <blockquote
                      key={i}
                      className="rounded-xl border border-line bg-white/60 p-4 text-sm"
                    >
                      <p className="text-ink-soft">&ldquo;{opinion.texto}&rdquo;</p>
                      <footer className="mt-2 font-medium text-ink">
                        — {opinion.autor}
                      </footer>
                    </blockquote>
                  ),
                )}
              </div>
            </section>
          )}

          <p className="mt-10 text-xs text-ink-soft">
            Última actualización: {actualizado}
          </p>
        </div>

        <aside className="h-fit rounded-3xl border border-line bg-gradient-to-b from-sage/20 to-white p-6">
          <h2 className="font-display text-lg text-teal-dark">Contacto</h2>

          {esPremium ? (
            <ul className="mt-4 space-y-3 text-sm">
              {clinic.telefono && (
                <li>
                  <a
                    href={`tel:${clinic.telefono}`}
                    className="text-ink hover:text-cyan"
                  >
                    {clinic.telefono}
                  </a>
                </li>
              )}
              {clinic.email && (
                <li>
                  <a
                    href={`mailto:${clinic.email}`}
                    className="text-ink hover:text-cyan"
                  >
                    {clinic.email}
                  </a>
                </li>
              )}
              {clinic.web && (
                <li>
                  <a
                    href={clinic.web}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink hover:text-cyan"
                  >
                    Sitio web ↗
                  </a>
                </li>
              )}
              {clinic.lat != null && clinic.lng != null && (
                <li>
                  <a
                    href={`https://www.google.com/maps?q=${clinic.lat},${clinic.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink hover:text-cyan"
                  >
                    Ver en el mapa ↗
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-ink-soft">
                Pide presupuesto a través de Growwly y esta clínica te
                responderá directamente.
              </p>
              <Link
                href="/cuenta/solicitud/nueva"
                className="mt-3 inline-block rounded-full bg-gradient-to-r from-yellow to-orange px-5 py-2.5 text-sm font-bold text-teal-dark shadow-md shadow-orange/20 transition hover:opacity-90"
              >
                Pedir presupuesto →
              </Link>
              {clinic.web && (
                <a
                  href={clinic.web}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block text-sm text-ink hover:text-cyan"
                >
                  Sitio web ↗
                </a>
              )}
            </div>
          )}

          {esPremium && clinic.direccion && (
            <>
              <h2 className="mt-6 font-display text-lg text-teal-dark">
                Dirección
              </h2>
              <p className="mt-2 text-sm text-ink-soft">{clinic.direccion}</p>
            </>
          )}

          {Array.isArray(clinic.horarios_estructurados) &&
          clinic.horarios_estructurados.length > 0 ? (
            <>
              <h2 className="mt-6 font-display text-lg text-teal-dark">
                Horario
              </h2>
              <dl className="mt-2 divide-y divide-line/60 text-sm">
                {(
                  clinic.horarios_estructurados as {
                    dia: string;
                    abierto: boolean;
                    desde: string;
                    hasta: string;
                  }[]
                ).map((d) => (
                  <div key={d.dia} className="flex justify-between py-1.5">
                    <dt className="text-ink-soft">{d.dia}</dt>
                    <dd className="text-ink">
                      {d.abierto ? `${d.desde} - ${d.hasta}` : "Cerrado"}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            clinic.horarios && (
              <>
                <h2 className="mt-6 font-display text-lg text-teal-dark">
                  Horarios
                </h2>
                <p className="mt-2 text-sm text-ink-soft">{clinic.horarios}</p>
              </>
            )
          )}

          {(clinic.precio_desde !== null ||
            clinic.precio_hasta !== null ||
            clinic.rango_precios) && (
            <>
              <h2 className="mt-6 font-display text-lg text-teal-dark">
                Precios (injerto capilar)
              </h2>
              {(clinic.precio_desde !== null || clinic.precio_hasta !== null) && (
                <p className="mt-2 text-sm font-medium text-ink">
                  {clinic.precio_desde !== null && clinic.precio_hasta !== null
                    ? `${formatearPrecio(clinic.precio_desde)} - ${formatearPrecio(clinic.precio_hasta)}`
                    : clinic.precio_desde !== null
                      ? `Desde ${formatearPrecio(clinic.precio_desde)}`
                      : `Hasta ${formatearPrecio(clinic.precio_hasta!)}`}
                </p>
              )}
              {clinic.rango_precios && (
                <p className="mt-1 text-sm text-ink-soft">
                  {clinic.rango_precios}
                </p>
              )}
            </>
          )}

          {clinic.accesibilidad && (
            <>
              <h2 className="mt-6 font-display text-lg text-teal-dark">
                Accesibilidad
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                {clinic.accesibilidad}
              </p>
            </>
          )}

          {esPremium && socialLinks.length > 0 && (
            <>
              <h2 className="mt-6 font-display text-lg text-teal-dark">
                Redes sociales
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink hover:text-cyan"
                    >
                      {link.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {esPremium && clinic.certificados.length > 0 && (
            <>
              <h2 className="mt-6 font-display text-lg text-teal-dark">
                Diplomas y certificados
              </h2>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {clinic.certificados.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-square overflow-hidden rounded-lg border border-line bg-white"
                  >
                    <Image
                      src={url}
                      alt={`Certificado ${i + 1}`}
                      fill
                      sizes="90px"
                      className="object-cover"
                    />
                  </a>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
      <SiteFooter />
    </main>
  );
}
