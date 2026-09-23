import Image from "next/image";
import Link from "next/link";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { Phone, Mail, Globe, MapPin, Megaphone, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ReactMarkdown from "react-markdown";
import { getSocialLinks } from "@/lib/social-links";
import { formatearPrecio, slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";
import { VerifiedBadge } from "@/components/clinics/verified-badge";
import { Carousel } from "@/components/clinics/carousel";
import { AntesDespuesGaleria } from "@/components/clinics/antes-despues-galeria";
import { ModuloValoraciones } from "@/components/clinics/modulo-valoraciones";
import { ModuloOpiniones } from "@/components/clinics/modulo-opiniones";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Params = { provincia: string; ciudad: string; slug: string };

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

/**
 * Cuando una clínica cambia de nombre, su slug cambia con ella — pero
 * el anterior queda guardado en slugs_antiguos, así que un enlace ya
 * compartido o indexado con la URL vieja sigue encontrando la ficha
 * aquí en vez de dar un 404.
 */
async function findClinicPorSlugAntiguo(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("provincia, ciudad, slug")
    .contains("slugs_antiguos", [slug])
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
  const provinciaSlug = slugifyProvincia(clinic.provincia);

  return {
    title: `${clinic.nombre}${clinic.ciudad ? ` en ${clinic.ciudad}` : ""}`,
    description: descripcion,
    alternates: { canonical: `/clinicas/${provinciaSlug}/${ciudadSlug}/${clinic.slug}` },
    openGraph: {
      title: clinic.nombre,
      description: descripcion,
      images: clinic.fotos.length > 0 ? [clinic.fotos[0]] : undefined,
    },
  };
}

function urlEmbedVideo(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** wa.me solo acepta dígitos (con prefijo de país, sin +, espacios ni guiones). */
function soloDigitos(telefono: string): string {
  return telefono.replace(/\D/g, "");
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.336-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
    </svg>
  );
}

export default async function ClinicaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { provincia, ciudad, slug } = await params;
  const clinic = await findClinic(slug);

  if (!clinic) {
    const viaSlugAntiguo = await findClinicPorSlugAntiguo(slug);
    if (viaSlugAntiguo) {
      const ciudadSlugViejo = viaSlugAntiguo.ciudad
        ? slugifyCiudad(viaSlugAntiguo.ciudad)
        : "clinica";
      const provinciaSlugViejo = slugifyProvincia(viaSlugAntiguo.provincia);
      permanentRedirect(
        `/clinicas/${provinciaSlugViejo}/${ciudadSlugViejo}/${viaSlugAntiguo.slug}`,
      );
    }
    notFound();
  }

  // La provincia/ciudad de la URL deben coincidir con las reales de la
  // clínica — si no, redirige a la URL correcta (evita contenido
  // duplicado y corrige enlaces desactualizados).
  const ciudadSlugReal = clinic.ciudad ? slugifyCiudad(clinic.ciudad) : null;
  const provinciaSlugReal = slugifyProvincia(clinic.provincia);
  if (
    (ciudadSlugReal && ciudad !== ciudadSlugReal) ||
    provincia !== provinciaSlugReal
  ) {
    redirect(`/clinicas/${provinciaSlugReal}/${ciudadSlugReal ?? "clinica"}/${clinic.slug}`);
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
    url: `${siteUrl}/clinicas/${provincia}/${ciudad}/${clinic.slug}`,
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
      {
        "@type": "ListItem",
        position: 3,
        name: clinic.provincia,
        item: `${siteUrl}/clinicas?provincia=${encodeURIComponent(clinic.provincia)}`,
      },
      ...(clinic.ciudad
        ? [
            {
              "@type": "ListItem",
              position: 4,
              name: clinic.ciudad,
              item: `${siteUrl}/clinicas/${provincia}/${ciudad}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: clinic.ciudad ? 5 : 4,
        name: clinic.nombre,
        item: `${siteUrl}/clinicas/${provincia}/${ciudad}/${clinic.slug}`,
      },
    ],
  };

  // Cada opinión escrita a mano por la clínica se marca como su propio
  // Review — es independiente de rating_google/resenas_google (la nota
  // agregada que se trae de la ficha de Google Maps), que ya alimenta el
  // aggregateRating de arriba.
  const opiniones = Array.isArray(clinic.opiniones)
    ? (clinic.opiniones as { autor: string; texto: string; puntuacion?: number }[])
    : [];
  const reviewsJsonLd = esPremium
    ? opiniones
        .filter((o) => o.puntuacion)
        .map((o) => ({
          "@context": "https://schema.org",
          "@type": "Review",
          itemReviewed: { "@type": "MedicalBusiness", name: clinic.nombre },
          author: { "@type": "Person", name: o.autor },
          reviewBody: o.texto,
          reviewRating: {
            "@type": "Rating",
            ratingValue: o.puntuacion,
            bestRating: 5,
            worstRating: 1,
          },
        }))
    : [];

  const hayDestacados =
    clinic.primera_consulta_gratis ||
    clinic.financiacion ||
    clinic.acepta_videoconsulta ||
    (esPremium && clinic.tiene_oferta);

  const medicos =
    esPremium && Array.isArray(clinic.medicos)
      ? (clinic.medicos as { nombre?: string; especialidad?: string; linkedin?: string }[])
      : [];

  return (
    <main className="relative flex-1 bg-[url('/brand/textura-hojas.png')] bg-cover bg-fixed bg-top">
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
      {reviewsJsonLd.map((review, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(review) }}
        />
      ))}
      <SiteHeader />

      <div className="mx-auto max-w-[1600px] px-6 pt-8">
        <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
          <Link href="/clinicas" className="hover:text-cyan">
            Clínicas
          </Link>
          <span aria-hidden>/</span>
          <Link
            href={`/clinicas?provincia=${encodeURIComponent(clinic.provincia)}`}
            className="hover:text-cyan"
          >
            {clinic.provincia}
          </Link>
          {clinic.ciudad && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/clinicas/${provincia}/${ciudad}`} className="hover:text-cyan">
                {clinic.ciudad}
              </Link>
            </>
          )}
          <span aria-hidden>/</span>
          <span className="text-ink">{clinic.nombre}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-[1600px] px-3 pb-8 pt-6 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="grid gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  {clinic.logo_url && (
                    <div className="relative h-14 w-28 shrink-0 sm:h-20 sm:w-44">
                      <Image
                        src={clinic.logo_url}
                        alt=""
                        fill
                        sizes="176px"
                        className="object-contain object-left"
                      />
                    </div>
                  )}
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
                </div>
                {clinic.verificado && <VerifiedBadge />}
              </div>

              {clinic.fotos.length > 0 ? (
                <div className="mt-5">
                  <Carousel fotos={clinic.fotos} nombreClinica={clinic.nombre} />
                </div>
              ) : (
                <div className="mt-5 flex aspect-[16/9] w-full items-center justify-center rounded-3xl bg-sage text-sage-ink">
                  Sin fotos todavía
                </div>
              )}

              {hayDestacados && (
                <section className="mt-6 rounded-2xl border border-yellow/50 bg-yellow/10 p-5">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-orange">
                    <Megaphone className="h-3.5 w-3.5" aria-hidden />
                    Importante
                  </p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {esPremium && clinic.tiene_oferta && (
                      <li className="flex items-center gap-2 text-sm font-semibold text-teal-dark">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange" aria-hidden />
                        {clinic.detalle_oferta || "Oferta activa"}
                      </li>
                    )}
                    {clinic.primera_consulta_gratis && (
                      <li className="flex items-center gap-2 text-sm font-semibold text-teal-dark">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange" aria-hidden />
                        1ª consulta gratis
                      </li>
                    )}
                    {clinic.financiacion && (
                      <li className="flex items-center gap-2 text-sm font-semibold text-teal-dark">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange" aria-hidden />
                        Financiación disponible
                      </li>
                    )}
                    {clinic.acepta_videoconsulta && (
                      <li className="flex items-center gap-2 text-sm font-semibold text-teal-dark">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-orange" aria-hidden />
                        Acepta videoconsulta
                      </li>
                    )}
                  </ul>
                </section>
              )}

              {clinic.descripcion && (
                <p className="mt-6 break-words text-ink-soft">{clinic.descripcion}</p>
              )}

              {esPremium && clinic.descripcion_extendida && (
                <section className="prose prose-teal mt-6 max-w-none prose-headings:font-display prose-headings:text-teal-dark">
                  <ReactMarkdown>{clinic.descripcion_extendida}</ReactMarkdown>
                </section>
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
                        className="break-words rounded-full border border-line px-3 py-1 text-sm text-ink-soft"
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

              {esPremium && clinic.video_url && urlEmbedVideo(clinic.video_url) && (
                <section className="mt-8">
                  <h2 className="font-display text-lg text-teal-dark">Vídeo</h2>
                  <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl">
                    <iframe
                      src={urlEmbedVideo(clinic.video_url)!}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </section>
              )}

              {medicos.length > 0 && (
                <section className="mt-8">
                  <h2 className="font-display text-lg text-teal-dark">
                    Equipo médico
                  </h2>
                  <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {medicos.map((m, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-line bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-ink">{m.nombre}</p>
                          {m.linkedin && (
                            <a
                              href={m.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`LinkedIn de ${m.nombre}`}
                              className="shrink-0 text-[#0A66C2] transition hover:opacity-75"
                            >
                              <LinkedinIcon className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                        {m.especialidad && (
                          <p className="text-sm text-ink-soft">{m.especialidad}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {esPremium && Array.isArray(clinic.fotos_antes_despues) && clinic.fotos_antes_despues.length > 0 && (
                <section className="mt-8">
                  <h2 className="font-display text-lg text-teal-dark">
                    Antes y después
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    Arrastra para comparar.
                  </p>
                  <div className="mt-3">
                    <AntesDespuesGaleria
                      pares={clinic.fotos_antes_despues as { antes: string; despues: string }[]}
                      nombreClinica={clinic.nombre}
                    />
                  </div>
                </section>
              )}

              {esPremium && <ModuloOpiniones opiniones={opiniones} />}

              <p className="mt-10 text-xs text-ink-soft">
                Última actualización: {actualizado}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              <ModuloValoraciones
                ratingGoogle={clinic.rating_google}
                resenasGoogle={clinic.resenas_google}
                ratingDoctoralia={clinic.rating_doctoralia}
                resenasDoctoralia={clinic.resenas_doctoralia}
              />

              <aside className="h-fit min-w-0 rounded-3xl border border-line bg-gradient-to-b from-sage/20 to-white p-6">
                <h2 className="font-display text-lg text-teal-dark">Contacto</h2>

                <ul className="mt-4 space-y-3 text-sm">
                  {clinic.telefono && (
                    <li className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 shrink-0 text-cyan-dark" aria-hidden />
                      <a
                        href={`tel:${clinic.telefono}`}
                        className="text-ink hover:text-cyan"
                      >
                        {clinic.telefono}
                      </a>
                    </li>
                  )}
                  {clinic.email && (
                    <li className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 shrink-0 text-cyan-dark" aria-hidden />
                      <a
                        href={`mailto:${clinic.email}`}
                        className="break-all text-ink hover:text-cyan"
                      >
                        {clinic.email}
                      </a>
                    </li>
                  )}
                  {clinic.web && (
                    <li className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 shrink-0 text-cyan-dark" aria-hidden />
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
                </ul>

                {clinic.telefono && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={`tel:${clinic.telefono}`}
                      className="press inline-flex items-center gap-1.5 rounded-full bg-teal-dark px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <Phone className="h-4 w-4" aria-hidden />
                      Llamar
                    </a>
                    <a
                      href={`https://wa.me/${soloDigitos(clinic.telefono)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="press inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </div>
                )}

                {clinic.direccion && (
                  <>
                    <h2 className="mt-6 font-display text-lg text-teal-dark">
                      Dirección
                    </h2>
                    <p className="mt-2 break-words text-sm text-ink-soft">{clinic.direccion}</p>
                    {clinic.lat != null && clinic.lng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${clinic.lat},${clinic.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm text-cyan hover:text-cyan-dark"
                      >
                        <MapPin className="h-4 w-4" aria-hidden />
                        Ver en el mapa ↗
                      </a>
                    )}
                  </>
                )}

                {Array.isArray(clinic.horarios_estructurados) &&
                clinic.horarios_estructurados.length > 0 ? (
                  <details open className="mt-6 group">
                    <summary className="cursor-pointer list-none font-display text-lg text-teal-dark">
                      Horario{" "}
                      <span className="ml-1 text-sm text-ink-soft transition group-open:rotate-180 inline-block">
                        ▾
                      </span>
                    </summary>
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
                  </details>
                ) : (
                  clinic.horarios && (
                    <>
                      <h2 className="mt-6 font-display text-lg text-teal-dark">
                        Horarios
                      </h2>
                      <p className="mt-2 break-words text-sm text-ink-soft">{clinic.horarios}</p>
                    </>
                  )
                )}

                {clinic.accesibilidad && (
                  <>
                    <h2 className="mt-6 font-display text-lg text-teal-dark">
                      Accesibilidad
                    </h2>
                    <p className="mt-2 break-words text-sm text-ink-soft">
                      {clinic.accesibilidad}
                    </p>
                  </>
                )}

                {esPremium ? (
                  (clinic.precio_desde !== null ||
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
                        <p className="mt-1 break-words text-sm text-ink-soft">
                          {clinic.rango_precios}
                        </p>
                      )}
                    </>
                  )
                ) : (
                  <>
                    <h2 className="mt-6 font-display text-lg text-teal-dark">
                      Precios (injerto capilar)
                    </h2>
                    <p className="mt-2 text-sm text-ink-soft">
                      Esta clínica no publica precio orientativo — pide presupuesto
                      y te responderá con uno personalizado.
                    </p>
                  </>
                )}

                <Link
                  href="/cuenta/solicitud/nueva"
                  className="press mt-5 block rounded-full bg-yellow px-6 py-3.5 text-center font-display text-base font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
                >
                  Pedir presupuesto →
                </Link>

                {esPremium && clinic.reserva_online_url && (
                  <a
                    href={clinic.reserva_online_url}
                    target="_blank"
                    rel="noreferrer"
                    className="press mt-2 inline-block rounded-full border border-teal px-5 py-2.5 text-sm font-bold text-teal-dark transition hover:bg-teal/5"
                  >
                    Reserva tu cita online ↗
                  </a>
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
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
