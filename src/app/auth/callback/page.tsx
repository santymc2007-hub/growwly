import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { CallbackClient } from "./callback-client";

type SearchParams = {
  code?: string;
  token_hash?: string;
  type?: string;
  next?: string;
};

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

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { code, token_hash, type, next } = await searchParams;
  const destino = aRutaRelativa(next ?? "/cuenta");
  const login = loginParaDestino(destino);

  // Formato recomendado por Supabase para enlaces por email: un
  // token_hash que se verifica directamente contra su servidor, sin
  // depender de ninguna cookie del navegador que lo pidió — por eso
  // funciona aunque el enlace se abra en otro dispositivo o navegador
  // distinto al que hizo la solicitud (el caso normal con el email).
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });

    if (!error) {
      redirect(destino);
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-sm text-error">
          El enlace no es válido o ha caducado.
        </p>
        <pre className="max-w-lg overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-paper-dim p-4 text-left text-xs text-ink-soft">
          {`token_hash recibido: ${token_hash}\ntype: ${type}\nverifyOtp (servidor) -> ERROR: ${error.message}`}
        </pre>
        <a href={login} className="text-sm font-medium text-cyan hover:text-cyan-dark">
          ← Volver a iniciar sesión
        </a>
      </main>
    );
  }

  // Formato antiguo/alternativo (?code= de PKCE) — se mantiene como
  // respaldo por si algún enlace todavía llega así.
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      redirect(destino);
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-sm text-error">
          El enlace no es válido o ha caducado.
        </p>
        <pre className="max-w-lg overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-paper-dim p-4 text-left text-xs text-ink-soft">
          {`code recibido: ${code}\nexchangeCodeForSession (servidor) -> ERROR: ${error.message}`}
        </pre>
        <a href={login} className="text-sm font-medium text-cyan hover:text-cyan-dark">
          ← Volver a iniciar sesión
        </a>
      </main>
    );
  }

  // Formato hash (#access_token=...) — el servidor nunca lo ve, se
  // comprueba en el cliente.
  return <CallbackClient code={code} next={destino} />;
}
