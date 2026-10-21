import { serializarJsonLd } from "@/lib/json-ld";
import Image from "next/image";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { tituloSeo, textoTitle, metaSeo, primerasFrases } from "@/lib/seo/meta";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BuscadorBlog } from "@/components/blog/buscador-blog";
import { EtiquetasBlog } from "@/components/blog/etiquetas-blog";
import { ContenidoEnriquecido, esHtml } from "@/components/contenido-enriquecido";
import Link from "next/link";
import { ClinicCardCompact } from "@/components/clinics/clinic-card-compact";
import {
  getDestinosTratamiento,
  getDestinosCiudad,
  destinosMencionados,
} from "@/lib/seo/enlaces-internos";
import { getCentrosConTecnica, recortar } from "@/lib/seo/landings";
import type { Clinic } from "@/lib/supabase/database.types";
import { BotonCompartir } from "@/components/ui/boton-compartir";

type Params = { slug: string };

// cache(): ver el mismo comentario en tratamientos/[slug]/page.tsx —
// generateMetadata y la página piden el mismo post por separado.
const findPost = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
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
  const post = await findPost(slug);
  if (!post) return {};
  // Meta: el resumen del post (o, sin resumen, las primeras frases del
  // artículo), solo frases completas que quepan.
  const description = metaSeo(primerasFrases(post.resumen || post.contenido, 158));
  const title = tituloSeo(post.titulo);
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: textoTitle(title),
      description,
      type: "article",
      publishedTime: post.publicado_en ?? undefined,
      images: post.imagen_portada ? [post.imagen_portada] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await findPost(slug);

  if (!post) {
    notFound();
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es";

  const [destinosTratamiento, destinosCiudad] = await Promise.all([
    getDestinosTratamiento(),
    getDestinosCiudad(),
  ]);

  // Tratamientos de los que habla el artículo (título y texto) y centros
  // que los ofrecen: el post deja de ser una página sin salida.
  const mencionados = destinosMencionados(
    `${post.titulo} ${post.contenido}`,
    destinosTratamiento,
  ).slice(0, 4);
  const centrosPorTecnica = await Promise.all(
    mencionados.filter((d) => d.tecnica).map((d) => getCentrosConTecnica(d.tecnica!)),
  );
  const vistos = new Set<string>();
  const centrosRelacionados: Clinic[] = [];
  for (const lista of centrosPorTecnica) {
    for (const c of lista) {
      if (!vistos.has(c.id) && centrosRelacionados.length < 4) {
        vistos.add(c.id);
        centrosRelacionados.push(c);
      }
    }
  }

  const fechaLarga = (f: string) =>
    new Date(f).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  // "Actualizado" solo si se tocó más de un día después de publicarse.
  const actualizado =
    post.publicado_en &&
    new Date(post.updated_at).getTime() - new Date(post.publicado_en).getTime() > 86_400_000
      ? fechaLarga(post.updated_at)
      : null;

  const faqs = Array.isArray(post.preguntas_frecuentes)
    ? (post.preguntas_frecuentes as { pregunta: string; respuesta: string }[])
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.resumen ?? undefined,
    image: post.imagen_portada ?? undefined,
    // Si hay cargo/credencial (ej. "Dermatólogo colegiado nº...") se marca
    // como Person con jobTitle, que es lo que Google e IA leen como señal
    // de autoridad (E-E-A-T). Sin cargo, se asume que firma "El equipo de
    // Growwly" y se marca como Organization.
    author: post.autor_cargo
      ? { "@type": "Person", name: post.autor, jobTitle: post.autor_cargo }
      : { "@type": "Organization", name: post.autor },
    datePublished: post.publicado_en ?? undefined,
    dateModified: post.updated_at,
    url: `${siteUrl}/blog/${post.slug}`,
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
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(jsonLd) }}
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
              {post.imagen_portada && (
                <div className="relative -mx-6 -mt-8 mb-6 aspect-[2/1] bg-sage sm:-mx-10 sm:aspect-[21/7] lg:mx-0 lg:mt-0 lg:aspect-[21/9] lg:overflow-hidden lg:rounded-2xl">
                  <Image
                    src={post.imagen_portada}
                    alt={post.titulo}
                    fill
                    sizes="(min-width: 1024px) 900px, 100vw"
                    priority
                    className="object-cover"
                  />
                </div>
              )}
                <Breadcrumbs
                  items={[
                    { label: "Blog", href: "/blog" },
                    { label: post.titulo, href: `/blog/${post.slug}` },
                  ]}
                />

                <h1 className="mt-4 font-display text-3xl text-teal-dark sm:text-4xl">
                  {post.titulo}
                </h1>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-soft">
                    {post.autor}
                    {post.autor_cargo && ` — ${post.autor_cargo}`}
                    {post.publicado_en && ` · ${fechaLarga(post.publicado_en)}`}
                    {actualizado && (
                      <>
                        {" · Actualizado el "}
                        <time dateTime={post.updated_at}>{actualizado}</time>
                      </>
                    )}
                  </p>
                  <BotonCompartir titulo={post.titulo} tipo="post" />
                </div>

                <ContenidoEnriquecido
                  contenido={post.contenido}
                  enlaces={[...destinosTratamiento, ...destinosCiudad]}
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

              <aside className="mt-8 flex flex-col gap-4 lg:sticky lg:top-8 lg:ml-auto lg:mt-0 lg:w-[320px] lg:shrink-0 lg:rounded-3xl lg:bg-paper-dim lg:p-5">
                {post.tags.length > 0 && (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <p className="font-display text-lg text-teal-dark">Etiquetas</p>
                    <div className="mt-3">
                      <EtiquetasBlog tags={post.tags} />
                    </div>
                  </div>
                )}

                {mencionados.length > 0 && (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <p className="font-display text-lg text-teal-dark">Tratamientos en este artículo</p>
                    <ul className="mt-3 flex flex-col gap-2 text-sm">
                      {mencionados.map((d) => (
                        <li key={d.href}>
                          <Link href={d.href} className="font-medium text-cyan hover:text-cyan-dark">
                            {d.nombre} →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl border border-line bg-white p-5">
                  <p className="font-display text-lg text-teal-dark">Buscar en el blog</p>
                  <div className="mt-3">
                    <BuscadorBlog />
                  </div>
                </div>
              </aside>
            </div>

            {centrosRelacionados.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-xl text-teal-dark">
                  Centros que ofrecen {mencionados.map((d) => d.nombre).slice(0, 2).join(" o ")}
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {centrosRelacionados.map((c) => (
                    <ClinicCardCompact key={c.id} clinic={c} />
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
