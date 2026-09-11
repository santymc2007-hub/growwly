import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
    author: { "@type": "Organization", name: post.autor },
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
    <main className="flex-1">
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

      <article className="mx-auto max-w-[1600px] px-6 py-12">
        <div className="lg:flex lg:items-start lg:gap-10">
          <div className="lg:max-w-2xl lg:flex-1">
            <Link
              href="/blog"
              className="text-sm font-medium text-cyan hover:text-cyan-dark"
            >
              ← Volver al blog
            </Link>

            <h1 className="mt-4 font-display text-3xl text-teal-dark sm:text-4xl">
              {post.titulo}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              {post.autor}
              {post.publicado_en &&
                ` · ${new Date(post.publicado_en).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`}
            </p>

            <div className="prose prose-teal mt-8 max-w-none prose-headings:font-display prose-headings:text-teal-dark prose-a:text-cyan">
              <ReactMarkdown>{post.contenido}</ReactMarkdown>
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

          {post.imagen_portada && (
            <aside className="mt-8 lg:sticky lg:top-8 lg:mt-0 lg:w-[360px] lg:shrink-0">
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                <div className="relative aspect-[4/3] w-full bg-sage">
                  <Image
                    src={post.imagen_portada}
                    alt={post.titulo}
                    fill
                    sizes="360px"
                    className="object-cover"
                  />
                </div>
              </div>
            </aside>
          )}
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
