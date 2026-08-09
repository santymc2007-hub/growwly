import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Blog | Growwly",
  description:
    "Artículos sobre salud capilar, tratamientos e injertos, y todo lo que hay que saber antes de dar el paso.",
};

export default async function BlogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("publicado", true)
    .order("publicado_en", { ascending: false });
  const posts = data ?? [];

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-[1600px] px-6 py-12">
        <h1 className="font-display text-3xl text-teal-dark">Blog</h1>
        <p className="mt-2 text-ink-soft">
          Consejos, novedades y todo lo que hay que saber sobre salud
          capilar.
        </p>

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-ink-soft">
            Todavía no hay entradas publicadas.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
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
      <SiteFooter />
    </main>
  );
}
