import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente con la clave secreta (antes llamada "service_role"): salta
 * las políticas RLS. Solo se debe usar dentro de Server Actions del
 * panel de administración, después de que el proxy ya haya comprobado
 * que hay sesión iniciada — nunca importar esto en un Client Component
 * ni exponer esta clave al navegador.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
