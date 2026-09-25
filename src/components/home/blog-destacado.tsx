import Link from "next/link";
import Image from "next/image";

type PostDestacado = {
  slug: string;
  titulo: string;
  resumen: string | null;
  imagen_portada: string | null;
};

export function BlogDestacado({ posts }: { posts: PostDestacado[] }) {
  if (posts.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-4xl font-extrabold text-teal-dark">
            Del blog
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">
            Consejos y novedades sobre salud capilar.
          </p>
        </div>
        <Link
          href="/blog"
          className="shrink-0 text-sm font-semibold text-cyan-dark underline-offset-4 hover:underline"
        >
          Ver todo el blog →
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:border-teal/40"
          >
            <div className="relative aspect-video w-full bg-sage">
              {post.imagen_portada && (
                <Image
                  src={post.imagen_portada}
                  alt={post.titulo}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-lg text-teal-dark group-hover:text-cyan">
                {post.titulo}
              </h3>
              {post.resumen && (
                <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                  {post.resumen}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
