import { createAdminClient } from "@/lib/supabase/admin";

/** Nombre de la persona que gestiona la cuenta, para el saludo de la cabecera. */
export async function obtenerNombreGestor(
  profileId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("nombre")
    .eq("id", profileId)
    .maybeSingle();

  return data?.nombre ?? null;
}
