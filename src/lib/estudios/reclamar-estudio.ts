import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vincula un estudio anónimo (creado antes de registrarse) a un usuario.
 * Solo reclama si el estudio todavía no tiene dueño, así nadie puede
 * "robar" un estudio ajeno adivinando o reutilizando un token.
 * Devuelve el id del estudio si lo consigue vincular, o null si no.
 */
export async function reclamarEstudio(
  userId: string,
  claimToken: string,
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("estudios_capilares")
    .update({ user_id: userId })
    .eq("claim_token", claimToken)
    .is("user_id", null)
    .select("id")
    .maybeSingle();

  return data?.id ?? null;
}
