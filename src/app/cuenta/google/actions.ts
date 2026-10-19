"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Acceso/registro de pacientes con Google (y acceso de clínicas). Sirve igual para entrar que
 * para crear la cuenta: si el email no existe, Supabase la crea y el
 * trigger `handle_new_user` le pone su perfil de paciente.
 *
 * Si viene de un análisis anónimo (`claim`), al volver de Google pasa
 * por /analisis/reclamar/[token] para quedarse con ese análisis.
 */
export async function entrarConGoogle(formData: FormData) {
  const claim = String(formData.get("claim") ?? "").trim();
  const origen = String(formData.get("origen") ?? "login");
  // "clinica": login del panel de clínicas. Al volver de Google pasa
  // por /auth/google-clinica, que comprueba que la cuenta sea de
  // clínica (igual que el login con contraseña).
  const area = String(formData.get("area") ?? "paciente");

  const h = await headers();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    h.get("origin") ??
    `https://${h.get("host")}`;

  const next =
    area === "clinica"
      ? "/auth/google-clinica"
      : claim
        ? `/analisis/reclamar/${claim}`
        : "/cuenta";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    const pagina =
      area === "clinica"
        ? "/clinica/login"
        : origen === "registro"
          ? "/cuenta/registro"
          : "/cuenta/login";
    redirect(
      `${pagina}?error=${encodeURIComponent(
        "No se ha podido conectar con Google. Inténtalo de nuevo o usa tu email.",
      )}${claim ? `&claim=${claim}` : ""}`,
    );
  }

  redirect(data.url);
}
