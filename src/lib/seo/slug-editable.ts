import type { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";

type Tabla = "tratamientos" | "blog_posts";
type Admin = ReturnType<typeof createAdminClient>;

/**
 * Slug final a partir de lo escrito en el formulario (o, si está vacío,
 * del título). Devuelve un error si otro registro ya usa ese slug, ya sea
 * como slug actual o como slug antiguo que redirige.
 */
export async function resolverSlug(
  supabase: Admin,
  tabla: Tabla,
  escrito: string | null,
  titulo: string,
  excludeId?: string,
): Promise<{ slug: string; error?: undefined } | { slug?: undefined; error: string }> {
  const slug = slugify(escrito || titulo);
  if (!slug) return { error: "El slug no puede quedar vacío." };

  let query = supabase
    .from(tabla)
    .select("id")
    .or(`slug.eq.${slug},slugs_anteriores.cs.{${slug}}`)
    .limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  if (data && data.length > 0) {
    return { error: `Ya hay otra página con el slug "${slug}". Elige otro.` };
  }
  return { slug };
}

/**
 * Al cambiar el slug, el viejo pasa a la lista de redirecciones (301) y el
 * nuevo sale de ella por si se está volviendo a uno anterior.
 */
export function actualizarSlugsAnteriores(
  anteriores: string[] | null | undefined,
  slugViejo: string | null | undefined,
  slugNuevo: string,
): string[] {
  const lista = new Set(anteriores ?? []);
  if (slugViejo && slugViejo !== slugNuevo) lista.add(slugViejo);
  lista.delete(slugNuevo);
  return [...lista];
}
