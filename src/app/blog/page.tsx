import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BuscadorBlog } from "@/components/blog/buscador-blog";
import { EtiquetasBlog } from "@/components/blog/etiquetas-blog";

export const metadata: Metadata = {
  title: "Blog | Growwly",
  description:
    "Artículos sobre salud capilar, tratamientos e injertos, y todo lo que hay que saber antes de dar el paso.",
  alternates: { canonical: "/blog" },
};

type SearchParams = { q?: string; tag?: string };

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, tag } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("publicado", true)
    .order("publicado_en", { ascending: false });
  const posts = data ?? [];

  const todasLasEtiquetas = Array.from(
    new Set(posts.flatMap((p) => p.tags)),
  ).sort((a, b) => a.localeCompare(b, "es"));

  let filtrados = posts;
  if (tag) filtrados = filtrados.filter((p) => p.tags.includes(tag));
  if (q) {
    const qLower = q.toLowerCase();
    filtrados = filtrados.filter(
      (p) =>
        p.titulo.toLowerCase().includes(qLower) ||
        (p.resumen?.toLowerCase().includes(qLower) ?? false) ||
        p.contenido.toLowerCase().includes(qLower),
    );
  }

  return (
    <main className="relative flex-1 bg-[url('/brand/textura-hojas.webp')] bg-cover bg-top lg:bg-fixed">
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-6 pb-10 pt-8">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }]} />

        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
          <span className="text-teal-dark">Blog</span> Growwly
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Consejos, novedades y todo lo que hay que saber sobre salud
          capilar.
        </p>
      </div>

      <div className="mx-auto max-w-[1400px] px-3 pb-8 sm:px-6 sm:pb-10">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-10">
            <div className="lg:flex lg:items-start lg:gap-10">
              <div className="lg:flex-1">
                {(q || tag) && (
                  <p className="mb-4 text-sm text-ink-soft">
                    {filtrados.length}{" "}
                    {filtrados.length === 1 ? "resultado" : "resultados"}
                    {q && (
                      <>
                        {" "}
                        para <span className="font-medium text-ink">&ldquo;{q}&rdquo;</span>
                      </>
                    )}
                    {tag && (
                      <>
                        {" "}
                        con la etiqueta <span className="font-medium text-ink">{tag}</span>
                      </>
                    )}
                    {" — "}
                    <Link href="/blog" className="text-cyan hover:text-cyan-dark">
                      quitar filtros
                    </Link>
                  </p>
                )}

                {filtrados.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    {posts.length === 0
                      ? "Todavía no hay entradas publicadas."
                      : "No hay artículos que encajen con esta búsqueda."}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filtrados.map((post) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition hover:border-teal/40"
                      >
                        <div className="relative aspect-video w-full bg-sage">
                          {post.imagen_portada && (
                            <Image
                              src={post.imagen_portada}
                              alt={post.titulo}
                              fill
                              sizes="(min-width: 640px) 400px, 100vw"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          {post.publicado_en && (
                            <p className="text-xs uppercase tracking-wide text-ink-soft">
                              {new Date(post.publicado_en).toLocaleDateString(
                                "es-ES",
                                { day: "numeric", month: "long", year: "numeric" },
                              )}
                            </p>
                          )}
                          <h2 className="mt-1 font-display text-lg text-teal-dark group-hover:text-cyan">
                            {post.titulo}
                          </h2>
                          {post.resumen && (
                            <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                              {post.resumen}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <aside className="mt-8 flex flex-col gap-4 lg:sticky lg:top-8 lg:mt-0 lg:w-[300px] lg:shrink-0">
                <div className="rounded-2xl border border-line bg-white p-5">
                  <p className="font-display text-lg text-teal-dark">Buscar</p>
                  <div className="mt-3">
                    <BuscadorBlog query={q} />
                  </div>
                </div>

                {todasLasEtiquetas.length > 0 && (
                  <div className="rounded-2xl border border-line bg-white p-5">
                    <p className="font-display text-lg text-teal-dark">Etiquetas</p>
                    <div className="mt-3">
                      <EtiquetasBlog tags={todasLasEtiquetas} activa={tag} />
                    </div>
                  </div>
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
