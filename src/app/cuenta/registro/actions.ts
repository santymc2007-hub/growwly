"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reclamarEstudio } from "@/lib/estudios/reclamar-estudio";

export async function registrarPaciente(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const edadRaw = String(formData.get("edad") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const claim = String(formData.get("claim") ?? "").trim();

  const volverConError = (msg: string) =>
    redirect(
      `/cuenta/registro?error=${encodeURIComponent(msg)}${
        claim ? `&claim=${claim}` : ""
      }`,
    );

  if (!nombre || !email || !password) {
    volverConError("Nombre, email y contraseña son obligatorios.");
  }

  if (password !== password2) {
    volverConError("Las contraseñas no coinciden.");
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  // Si hay un estudio pendiente de reclamar, el enlace de confirmación
  // de email pasa primero por /analisis/reclamar/[token] antes de
  // llevar a la cuenta — así no se pierde el análisis por el camino.
  const next = claim ? `/analisis/reclamar/${claim}` : "/cuenta";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre,
        apellidos,
        telefono,
        edad: edadRaw,
      },
      ...(siteUrl && {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      }),
    },
  });

  if (error) {
    volverConError(error.message);
    return;
  }

  // Si el proyecto tiene la confirmación por email activada (por defecto en
  // Supabase), todavía no hay sesión iniciada tras el signUp.
  if (!data.session) {
    redirect("/cuenta/registro/revisa-tu-email");
  }

  if (claim && data.user) {
    const estudioId = await reclamarEstudio(data.user.id, claim);
    if (estudioId) {
      redirect(`/cuenta/analisis/${estudioId}`);
    }
  }

  redirect("/cuenta");
}
