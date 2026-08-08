import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSocialLinks } from "@/lib/social-links";
import { formatearPrecio } from "@/lib/clinic-options";
import { VerifiedBadge } from "@/components/clinics/verified-badge";
import { SiteHeader } from "@/components/site-header";

type Params = { slug: string };

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

  return {
    title: `${clinic.nombre}${clinic.ciudad ? ` en ${clinic.ciudad}` : ""}`,
    description: descripcion,
    alternates: { canonical: `/clinicas/${clinic.slug}` },
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
  const { slug } = await params;
  const clinic = await findClinic(slug);

  if (!clinic) {
    notFound();
  }

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
    url: `${siteUrl}/clinicas/${clinic.slug}`,
    image: clinic.fotos.length > 0 ? clinic.fotos : undefined,
    telephone: clinic.telefono ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.direccion ?? undefined,
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

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-6 pt-8">
        <Link
          href="/clinicas"
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          ← Volver al listado
        </Link>
      </div>

      <div className="mx-auto mt-4 max-w-4xl px-6">
        {portada ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-sage">
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
          <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-sage text-sage-ink">
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

      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-10 lg:grid-cols-[1fr_280px]">
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
                {clinic.tecnicas.map((tecnica) => (
                  <span
                    key={tecnica}
                    className="rounded-full bg-sage px-3 py-1 text-sm font-medium text-sage-ink"
                  >
                    {tecnica}
                  </span>
                ))}
              </div>
            </section>
          )}

          {clinic.servicios_adicionales.length > 0 && (
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
            clinic.tiene_oferta) && (
            <section className="mt-8 flex flex-wrap gap-3 text-sm">
              {clinic.tiene_oferta && (
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

          <p className="mt-10 text-xs text-ink-soft">
            Última actualización: {actualizado}
          </p>
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white/60 p-6">
          <h2 className="font-display text-lg text-teal-dark">Contacto</h2>
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

          {clinic.direccion && (
            <>
              <h2 className="mt-6 font-display text-lg text-teal-dark">
                Dirección
              </h2>
              <p className="mt-2 text-sm text-ink-soft">{clinic.direccion}</p>
            </>
          )}

          {clinic.horarios && (
            <>
              <h2 className="mt-6 font-display text-lg text-teal-dark">
                Horarios
              </h2>
              <p className="mt-2 text-sm text-ink-soft">{clinic.horarios}</p>
            </>
          )}

          {(clinic.precio_desde !== null ||
            clinic.precio_hasta !== null ||
            clinic.rango_precios) && (
            <>
              <h2 className="mt-6 font-display text-lg text-teal-dark">
                Precios
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

          {socialLinks.length > 0 && (
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
        </aside>
      </div>
    </main>
  );
}
