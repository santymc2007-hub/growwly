"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function loginParaDestino(next: string): string {
  if (next.startsWith("/admin")) return "/admin/login";
  if (next.startsWith("/clinica")) return "/clinica/login";
  return "/cuenta/login";
}

export function CallbackClient({
  code,
  next,
}: {
  code?: string;
  next: string;
}) {
  const router = useRouter();
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function procesar() {
      const supabase = createClient();

      // Formato 1: el enlace trae el token tras el "#" (access_token /
      // refresh_token). Eso el servidor NUNCA lo ve — solo se puede leer
      // aquí, en el navegador, con window.location.hash.
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (!error && !cancelado) {
            router.replace(next);
            return;
          }
        }
      }

      // Formato 2: el enlace trae ?code=... en la propia URL (formato
      // estándar PKCE) — este sí lo recibe el servidor, pero también se
      // puede intercambiar aquí mismo.
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && !cancelado) {
          router.replace(next);
          return;
        }
      }

      if (!cancelado) setFallo(true);
    }

    procesar();
    return () => {
      cancelado = true;
    };
  }, [code, next, router]);

  useEffect(() => {
    if (fallo) {
      const login = loginParaDestino(next);
      window.location.href = `${login}?error=${encodeURIComponent(
        "El enlace no es válido o ha caducado. Prueba a iniciar sesión de nuevo.",
      )}`;
    }
  }, [fallo, next]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-ink-soft">Confirmando tu enlace…</p>
    </main>
  );
}
