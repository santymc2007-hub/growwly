import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Antes corría en todo el sitio — incluidas páginas 100% públicas
  // (home, blog, tratamientos, fichas de clínica) que no necesitan
  // saber quién eres, pagando en cada una la llamada de red a
  // Supabase Auth que hace updateSession(). Ahora solo entra donde de
  // verdad hace falta: refrescar sesión de paciente/clínica y proteger
  // /admin.
  matcher: ["/admin/:path*", "/cuenta/:path*", "/clinica/:path*"],
};
