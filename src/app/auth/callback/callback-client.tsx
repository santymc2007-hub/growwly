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
  const [diagnostico, setDiagnostico] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelado = false;
    const log: string[] = [];

    async function procesar() {
      const supabase = createClient();

      log.push(`URL completa: ${window.location.href}`);
      log.push(`code recibido: ${code ?? "(ninguno)"}`);
      const hash = window.location.hash;
      log.push(`hash recibido: ${hash || "(ninguno)"}`);

      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          log.push(
            `setSession (vía hash) -> ${error ? `ERROR: ${error.message}` : "OK"}`,
          );
          if (!error && !cancelado) {
            router.replace(next);
            return;
          }
        } else {
          log.push("El hash tenía access_token pero faltaba algún dato.");
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        log.push(
          `exchangeCodeForSession -> ${error ? `ERROR: ${error.message}` : "OK"}`,
        );
        if (!error && !cancelado) {
          router.replace(next);
          return;
        }
      }

      if (!cancelado) setDiagnostico(log);
    }

    procesar();
    return () => {
      cancelado = true;
    };
  }, [code, next, router]);

  if (diagnostico) {
    const login = loginParaDestino(next);
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-sm text-error">
          El enlace no es válido o ha caducado.
        </p>
        <pre className="max-w-lg overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-paper-dim p-4 text-left text-xs text-ink-soft">
          {diagnostico.join("\n")}
        </pre>
        <a href={login} className="text-sm font-medium text-cyan hover:text-cyan-dark">
          ← Volver a iniciar sesión
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-ink-soft">Confirmando tu enlace…</p>
    </main>
  );
}
