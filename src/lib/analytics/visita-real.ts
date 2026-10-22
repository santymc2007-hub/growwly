import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Buscadores, rastreadores de redes sociales, herramientas SEO, IAs,
 * monitores y clientes HTTP. No hace falta que sea exhaustiva: basta
 * con quitar el grueso del tráfico automático para que las visitas a
 * fichas sirvan como argumento de venta ante las clínicas.
 */
const PATRON_BOT =
  /bot|crawl|spider|slurp|facebookexternalhit|meta-externalagent|facebot|bingpreview|lighthouse|pagespeed|headless|phantom|puppeteer|playwright|selenium|vercel|preview|scanner|monitor|uptime|curl|wget|python|java\/|go-http|axios|node-fetch|okhttp|ahrefs|semrush|mj12|dataforseo|screaming|gptbot|claude|anthropic|perplexity|bytespider|applebot|yandex|baidu|duckduck|petal|seznam/i;

/**
 * true si la petición parece de una persona navegando: ni bot, ni
 * prefetch del navegador o de Next.js. Lee las cabeceras, así que en
 * una página hay que llamarla ANTES de after() (dentro no se puede).
 */
export async function esVisitaDePersona(): Promise<boolean> {
  const h = await headers();
  if (
    h.get("next-router-prefetch") ||
    h.get("purpose") === "prefetch" ||
    (h.get("sec-purpose") ?? "").includes("prefetch")
  ) {
    return false;
  }
  const ua = h.get("user-agent") ?? "";
  return ua.length > 0 && !PATRON_BOT.test(ua);
}

/**
 * true si quien mira la ficha es de casa: un admin de Growwly o
 * alguien de la propia clínica. Sus visitas no cuentan en las
 * estadísticas. Usa solo la clave secreta (se puede llamar dentro de
 * after(), con el id de usuario leído antes).
 */
export async function esVisitaInterna(
  admin: SupabaseClient<Database>,
  userId: string | null,
  clinicId: string,
): Promise<boolean> {
  if (!userId) return false;
  const [{ data: perfil }, { data: miembro }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", userId).maybeSingle(),
    admin
      .from("clinic_members")
      .select("id")
      .eq("profile_id", userId)
      .eq("clinic_id", clinicId)
      .maybeSingle(),
  ]);
  return perfil?.role === "admin" || Boolean(miembro);
}
