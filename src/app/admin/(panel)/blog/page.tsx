import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeletePostButton } from "./delete-button";

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });
  const posts = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-teal-dark">Blog</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {posts.length} {posts.length === 1 ? "entrada" : "entradas"}
          </p>
        </div>
        <Link
          href="/admin/blog/nuevo"
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-dark"
        >
          + Nueva entrada
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-dim text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Actualizado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-ink">
                  {post.titulo}
                </td>
                <td className="px-4 py-3">
                  {post.publicado ? (
                    <span className="rounded-full bg-sage px-2.5 py-1 text-xs font-medium text-sage-ink">
                      Publicado
                    </span>
                  ) : (
                    <span className="rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-ink-soft">
                      Borrador
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {new Date(post.updated_at).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/blog/${post.id}/editar`}
                      className="font-medium text-cyan hover:text-cyan-dark"
                    >
                      Editar
                    </Link>
                    <DeletePostButton id={post.id} titulo={post.titulo} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            Todavía no has escrito ninguna entrada.
          </p>
        )}
      </div>
    </div>
  );
}
