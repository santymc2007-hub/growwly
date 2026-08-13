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
      auth: {
        // "implicit" en vez de "pkce": los enlaces de recuperación de
        // contraseña y confirmación de email se abren casi siempre en
        // un contexto distinto al que los pidió (el correo, otra
        // pestaña...), y PKCE exige una cookie del navegador que los
        // pidió — con enlaces por email eso falla constantemente.
        flowType: "implicit",
      },
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
