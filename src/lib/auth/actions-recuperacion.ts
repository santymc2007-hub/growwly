"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Seccion = "cuenta" | "clinica" | "admin";

const LOGIN_POR_SECCION: Record<Seccion, string> = {
  cuenta: "/cuenta/login",
  clinica: "/clinica/login",
  admin: "/admin/login",
};

function seccionValida(valor: string): Seccion {
  return valor === "clinica" || valor === "admin" ? valor : "cuenta";
}

/** Paso 1: el usuario pide el enlace de recuperación desde .../olvide-password */
export async function solicitarRecuperacion(formData: FormData) {
  const seccion = seccionValida(String(formData.get("seccion") ?? "cuenta"));
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(
      `/${seccion}/olvide-password?error=${encodeURIComponent("Escribe un email válido.")}`,
    );
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://growwly-theta.vercel.app";
  const next = `/${seccion}/restablecer-password`;

  // No comprobamos ni informamos si el email existe o no — mensaje
  // siempre genérico, para no filtrar qué cuentas están registradas.
  //
  // redirectTo tiene que ser una URL absoluta completa — Supabase la
  // valida contra la lista de "Redirect URLs" del proyecto, y si le
  // mandamos solo una ruta relativa, la descarta y usa el Site URL por
  // defecto (nos pasó justo eso). La plantilla de email en Supabase
  // usa {{ .RedirectTo }} para construir el enlace final.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}${next}`,
  });

  redirect(`/${seccion}/olvide-password?enviado=1`);
}

/** Paso 2: tras pulsar el enlace del email, aquí pone la contraseña nueva */
export async function actualizarPasswordRecuperada(
  seccionRaw: string,
  formData: FormData,
) {
  const seccion = seccionValida(seccionRaw);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `${LOGIN_POR_SECCION[seccion]}?error=${encodeURIComponent(
        "El enlace ha caducado o ya se usó — pide uno nuevo.",
      )}`,
    );
  }

  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (!password || password.length < 6) {
    redirect(
      `/${seccion}/restablecer-password?error=${encodeURIComponent(
        "La contraseña debe tener al menos 6 caracteres.",
      )}`,
    );
  }
  if (password !== password2) {
    redirect(
      `/${seccion}/restablecer-password?error=${encodeURIComponent(
        "Las contraseñas no coinciden.",
      )}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(
      `/${seccion}/restablecer-password?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(`/${seccion}`);
}
