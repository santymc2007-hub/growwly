import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Cliente de Supabase para usar en Server Components, Server Actions
 * y Route Handlers. Lee/escribe cookies de sesión cuando haya login
 * (por ejemplo, para el futuro panel de gestión de clínicas).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll fue llamado desde un Server Component sin middleware
            // de refresco de sesión. Se puede ignorar si no hay auth aún.
          }
        },
      },
    },
  );
}
