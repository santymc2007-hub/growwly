import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Comprueba que quien llama es admin. Va al principio de CADA Server
 * Action del panel de administración.
 *
 * El proxy (src/proxy.ts) ya protege las páginas de /admin, pero una
 * Server Action es un endpoint público: Next.js puede ejecutarla desde
 * una petición a otra ruta, que no pasa por el matcher del proxy. Y
 * estas acciones usan la clave secreta, que salta RLS. Así que la
 * comprobación tiene que estar dentro de la acción (auditoría de
 * seguridad, oct 2026).
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin/login");

  return { userId: user.id };
}
