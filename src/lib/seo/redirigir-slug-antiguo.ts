import { permanentRedirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Si `slug` es un slug antiguo de un tratamiento o post publicado, redirige
 * (308 permanente) a su URL actual. Si no, no hace nada y la página sigue
 * con su notFound().
 */
export async function redirigirSlugAntiguo(
  tabla: "tratamientos" | "blog_posts",
  slug: string,
  construirRuta: (slugActual: string) => string,
): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase
    .from(tabla)
    .select("slug")
    .contains("slugs_anteriores", [slug])
    .eq("publicado", true)
    .limit(1)
    .maybeSingle();
  if (data?.slug && data.slug !== slug) permanentRedirect(construirRuta(data.slug));
}
