import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { destinosMencionados, type DestinoEnlace } from "@/lib/seo/enlaces-internos";

export type PostResumen = {
  slug: string;
  titulo: string;
  resumen: string | null;
  imagen_portada: string | null;
  contenido: string;
  tags: string[];
};

/**
 * Posts publicados. Se cargan enteros (con contenido) para poder buscar
 * menciones: con el volumen actual del blog es barato. Si algún día pasa
 * de ~200 posts, mover la detección a una columna precalculada.
 */
export const getPostsPublicados = cache(async (): Promise<PostResumen[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, titulo, resumen, imagen_portada, contenido, tags")
    .eq("publicado", true)
    .order("publicado_en", { ascending: false });
  return (data ?? []) as PostResumen[];
});

/** Posts que hablan de un tratamiento (título, etiquetas o texto). */
export async function postsSobreTratamiento(
  destino: DestinoEnlace,
  max = 3,
): Promise<PostResumen[]> {
  const posts = await getPostsPublicados();
  const puntuados = posts
    .map((p) => {
      const enTitulo = destinosMencionados(`${p.titulo} ${p.tags.join(" ")}`, [destino]).length > 0;
      const enTexto = destinosMencionados(p.contenido, [destino]).length > 0;
      return { p, puntos: (enTitulo ? 2 : 0) + (enTexto ? 1 : 0) };
    })
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos);
  return puntuados.slice(0, max).map((x) => x.p);
}
