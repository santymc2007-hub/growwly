import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CallbackClient } from "./callback-client";

type SearchParams = { code?: string; next?: string };

function loginParaDestino(next: string): string {
  if (next.startsWith("/admin")) return "/admin/login";
  if (next.startsWith("/clinica")) return "/clinica/login";
  return "/cuenta/login";
}

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { code, next } = await searchParams;
  const destino = next ?? "/cuenta";

  if (code) {
    const cookieStore = await cookies();
    const nombresCookies = cookieStore.getAll().map((c) => c.name);

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      redirect(destino);
    }

    const login = loginParaDestino(destino);
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-sm text-error">
          El enlace no es válido o ha caducado.
        </p>
        <pre className="max-w-lg overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-paper-dim p-4 text-left text-xs text-ink-soft">
          {`code recibido: ${code}\ncookies presentes en esta petición: ${nombresCookies.join(", ") || "(ninguna)"}\nexchangeCodeForSession (servidor) -> ERROR: ${error.message}`}
        </pre>
        <a href={login} className="text-sm font-medium text-cyan hover:text-cyan-dark">
          ← Volver a iniciar sesión
        </a>
      </main>
    );
  }

  // Sin "code" en la URL — sería el formato antiguo con el token tras el
  // "#", que el servidor nunca llega a ver. Lo comprobamos en el cliente.
  return <CallbackClient code={code} next={destino} />;
}
