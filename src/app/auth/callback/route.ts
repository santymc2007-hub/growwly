import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function loginParaDestino(next: string): string {
  if (next.startsWith("/admin")) return "/admin/login";
  if (next.startsWith("/clinica")) return "/clinica/login";
  return "/cuenta/login";
}

function aRutaRelativa(next: string): string {
  try {
    const url = new URL(next);
    return url.pathname + url.search;
  } catch {
    return next; // ya era una ruta relativa
  }
}

/**
 * A esta ruta llegan los enlaces de recuperación de contraseña y
 * confirmación de email que manda Supabase. IMPORTANTE: tiene que ser
 * un Route Handler (no una página / Server Component) porque solo los
 * Route Handlers y las Server Actions pueden guardar cookies de verdad
 * — en un Server Component esa escritura se descarta en silencio, sin
 * dar ningún error, y la sesión nunca llega a existir de verdad.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/cuenta";
  const destino = aRutaRelativa(nextRaw);
  const login = loginParaDestino(destino);

  const supabase = await createClient();

  // Formato recomendado por Supabase para enlaces por email: no depende
  // de ninguna cookie del navegador que hizo la solicitud.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${destino}`);
    }
    return NextResponse.redirect(
      `${origin}${login}?error=${encodeURIComponent(
        `El enlace no es válido o ha caducado (${error.message}).`,
      )}`,
    );
  }

  // Formato alternativo (?code= de PKCE) — de respaldo.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${destino}`);
    }
    return NextResponse.redirect(
      `${origin}${login}?error=${encodeURIComponent(
        `El enlace no es válido o ha caducado (${error.message}).`,
      )}`,
    );
  }

  // Ni token_hash ni code — podría venir en formato hash
  // (#access_token=...), que el servidor nunca llega a ver. Se
  // comprueba en una página cliente aparte.
  return NextResponse.redirect(
    `${origin}/auth/callback-cliente?next=${encodeURIComponent(nextRaw)}`,
  );
}
