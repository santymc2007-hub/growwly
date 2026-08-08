import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";

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

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <article className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/blog"
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          ← Volver al blog
        </Link>

        <h1 className="mt-4 font-display text-3xl text-teal-dark">
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

        {post.imagen_portada && (
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl border border-line bg-sage">
            <Image
              src={post.imagen_portada}
              alt={post.titulo}
              fill
              sizes="700px"
              className="object-cover"
            />
          </div>
        )}

        <div className="prose prose-teal mt-8 max-w-none prose-headings:font-display prose-headings:text-teal-dark prose-a:text-cyan">
          <ReactMarkdown>{post.contenido}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
