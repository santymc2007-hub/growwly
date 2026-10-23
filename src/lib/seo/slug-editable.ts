import { slugify } from "@/lib/slugify";
import type { createAdminClient } from "@/lib/supabase/admin";

type Tabla = "blog_posts" | "tratamientos";

/**
 * Calcula el slug a guardar. Si cambia respecto al actual, el anterior
 * pasa a slugs_antiguos (la página redirige 301 desde él). Devuelve
 * error si el slug ya lo usa otro registro.
 */
export async function resolverSlug(
  supabase: ReturnType<typeof createAdminClient>,
  tabla: Tabla,
  opciones: { id?: string; slugPedido: string; textoBase: string },
): Promise<{ slug: string; slugs_antiguos?: string[] } | { error: string }> {
  const slug = slugify(opciones.slugPedido) || slugify(opciones.textoBase);
  if (!slug) return { error: "La URL no puede estar vacía." };

  let q = supabase.from(tabla).select("id").or(`slug.eq.${slug},slugs_antiguos.cs.{${slug}}`);
  if (opciones.id) q = q.neq("id", opciones.id);
  const { data: choque } = await q.limit(1);
  if (choque && choque.length > 0) return { error: `La URL "${slug}" ya la usa otra página.` };

  if (!opciones.id) return { slug };

  const { data: actual } = await supabase
    .from(tabla)
    .select("slug, slugs_antiguos")
    .eq("id", opciones.id)
    .maybeSingle();
  if (!actual || actual.slug === slug) return { slug };

  const antiguos = new Set<string>(actual.slugs_antiguos ?? []);
  antiguos.add(actual.slug);
  antiguos.delete(slug);
  return { slug, slugs_antiguos: [...antiguos] };
}

/** Slug actual de un registro al que se llega con un slug antiguo (o null). */
export async function slugActualDesdeAntiguo(tabla: Tabla, slugViejo: string): Promise<string | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from(tabla)
    .select("slug")
    .contains("slugs_antiguos", [slugViejo])
    .eq("publicado", true)
    .limit(1)
    .maybeSingle();
  return data?.slug ?? null;
}
