import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * A esta ruta llegan los enlaces de confirmación de email, reseteo de
 * contraseña, etc. que manda Supabase Auth. Intercambia el "code" por
 * una sesión real y redirige a donde corresponda.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cuenta";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/cuenta/login?error=${encodeURIComponent(
      "El enlace no es válido o ha caducado. Prueba a iniciar sesión de nuevo.",
    )}`,
  );
}
