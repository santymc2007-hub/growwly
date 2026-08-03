import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Cliente de Supabase para usar en Client Components ("use client").
 * Usa la clave pública (publishable key, antes llamada "anon key"):
 * respeta las políticas RLS de la BD.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
