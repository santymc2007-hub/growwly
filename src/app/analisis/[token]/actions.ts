"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { reclamarEstudio } from "@/lib/estudios/reclamar-estudio";

export type EstadoDesbloqueo =
  | { paso: "datos"; error?: string; email?: string; nombre?: string }
  | { paso: "codigo"; email: string; nombre: string; error?: string; reenviado?: boolean }
  | { paso: "listo"; destino: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function traducirErrorEnvio(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("security purposes") || m.includes("rate limit")) {
    return "Acabamos de enviarte un código. Espera un minuto antes de pedir otro.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "Revisa el email: parece que no es correcto.";
  }
  return "No hemos podido enviarte el código. Inténtalo de nuevo en un momento.";
}

/**
 * Paso 1 del desbloqueo: guarda el email en el estudio (así el contacto
 * queda captado aunque no llegue a escribir el código) y pide a Supabase
 * que le mande un código de acceso. Si el email no tiene cuenta, Supabase
 * la crea; si ya la tiene, el mismo código sirve para entrar.
 */
export async function enviarCodigoValoracion(
  _prev: EstadoDesbloqueo,
  formData: FormData,
): Promise<EstadoDesbloqueo> {
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 80);

  if (!nombre) {
    return { paso: "datos", error: "Escribe tu nombre.", email, nombre };
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { paso: "datos", error: "Revisa el email: parece que no es correcto.", email, nombre };
  }

  const admin = createAdminClient();
  const { data: estudio } = await admin
    .from("estudios_capilares")
    .select("id, user_id, estado, email_capturado_en")
    .eq("claim_token", token)
    .maybeSingle();

  if (!estudio || estudio.estado !== "listo") {
    return { paso: "datos", error: "No encontramos tu valoración. Vuelve a cargar la página.", email, nombre };
  }
  if (estudio.user_id) {
    return { paso: "listo", destino: `/cuenta/analisis/${estudio.id}` };
  }

  await admin
    .from("estudios_capilares")
    .update({
      email_contacto: email,
      nombre_contacto: nombre,
      ...(estudio.email_capturado_en ? {} : { email_capturado_en: new Date().toISOString() }),
    })
    .eq("id", estudio.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(`/analisis/reclamar/${token}`)}`,
      // Lo recoge el trigger handle_new_user para el perfil (solo si la
      // cuenta es nueva; a una cuenta existente no se le cambia nada).
      data: { nombre },
    },
  });

  if (error) {
    return { paso: "datos", error: traducirErrorEnvio(error.message), email, nombre };
  }

  return {
    paso: "codigo",
    email,
    nombre,
    reenviado: formData.get("reenviar") === "1",
  };
}

/**
 * Paso 2: comprueba el código, deja la sesión iniciada y vincula el
 * estudio a la cuenta. Devuelve el destino para que el navegador mande
 * el evento de alta antes de navegar.
 */
export async function verificarCodigoValoracion(
  _prev: EstadoDesbloqueo,
  formData: FormData,
): Promise<EstadoDesbloqueo> {
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nombre = String(formData.get("nombre") ?? "");
  const codigo = String(formData.get("codigo") ?? "").replace(/\D/g, "");

  if (codigo.length < 6) {
    return { paso: "codigo", email, nombre, error: "Escribe el código completo que te hemos enviado." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" });

  if (error || !data.user) {
    return {
      paso: "codigo",
      email,
      nombre,
      error: "El código no es correcto o ha caducado. Revísalo o pide uno nuevo.",
    };
  }

  const estudioId = await reclamarEstudio(data.user.id, token);
  if (estudioId) {
    return { paso: "listo", destino: `/cuenta/analisis/${estudioId}` };
  }

  // Ya estaba vinculado (p. ej. lo reclamó desde el enlace del email en
  // otra pestaña): si es suyo, lo llevamos igualmente al resultado.
  const admin = createAdminClient();
  const { data: estudio } = await admin
    .from("estudios_capilares")
    .select("id, user_id")
    .eq("claim_token", token)
    .maybeSingle();

  if (estudio && estudio.user_id === data.user.id) {
    return { paso: "listo", destino: `/cuenta/analisis/${estudio.id}` };
  }
  return { paso: "listo", destino: "/cuenta" };
}
