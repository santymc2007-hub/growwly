import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { FondoTextura } from "@/components/fondo-textura";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BuscadorBlog } from "@/components/blog/buscador-blog";
import { EtiquetasBlog } from "@/components/blog/etiquetas-blog";
import { ContenidoEnriquecido } from "@/components/contenido-enriquecido";

type Params = { slug: string };

async function findPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
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
  const post = await findPost(slug);
  if (!post) return {};
  return {
    title: post.titulo,
    description: post.resumen ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.titulo,
      description: post.resumen ?? undefined,
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
    process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <SiteHeader />

      <article className="mx-auto max-w-[1400px] px-3 pb-8 pt-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {post.imagen_portada && (
            <div className="relative aspect-[16/6] w-full bg-sage sm:aspect-[21/6]">
              <Image
                src={post.imagen_portada}
                alt={post.titulo}
                fill
                sizes="1600px"
                priority
                className="object-cover"
              />
            </div>
          )}

          <div className="px-6 py-8 sm:px-10">
            <div className="lg:flex lg:items-start lg:gap-10">
              <div className="lg:max-w-3xl lg:flex-1">
                <Breadcrumbs
                  items={[
                    { label: "Blog", href: "/blog" },
                    { label: post.titulo, href: `/blog/${post.slug}` },
                  ]}
                />

                <h1 className="mt-4 font-display text-3xl text-teal-dark sm:text-4xl">
                  {post.titulo}
                </h1>
                <p className="mt-2 text-sm text-ink-soft">
                  {post.autor}
                  {post.autor_cargo && ` — ${post.autor_cargo}`}
                  {post.publicado_en &&
                    ` · ${new Date(post.publicado_en).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}`}
                </p>

                <ContenidoEnriquecido contenido={post.contenido} />

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

              <aside className="mt-8 flex flex-col gap-4 lg:sticky lg:top-8 lg:mt-0 lg:w-[300px] lg:shrink-0">
                {post.tags.length > 0 && (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <p className="font-display text-lg text-teal-dark">Etiquetas</p>
                    <div className="mt-3">
                      <EtiquetasBlog tags={post.tags} />
                    </div>
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
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
