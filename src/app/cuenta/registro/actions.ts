"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reclamarEstudio } from "@/lib/estudios/reclamar-estudio";

export type EstadoRegistro = {
  error?: string;
  /** Lo que escribió (sin contraseñas), para no tener que repetirlo. */
  valores?: { nombre: string; apellidos: string; email: string; telefono: string; edad: string };
};

export async function registrarPaciente(
  _prev: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const edadRaw = String(formData.get("edad") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const claim = String(formData.get("claim") ?? "").trim();

  // Si algo falla, se devuelve el error con lo que había escrito: antes se
  // redirigía y el formulario se vaciaba entero (oct 2026).
  const valores = { nombre, apellidos, email, telefono, edad: edadRaw };
  const conError = (msg: string): EstadoRegistro => ({ error: msg, valores });

  if (!nombre || !email || !password) {
    return conError("Nombre, email y contraseña son obligatorios.");
  }

  if (password !== password2) {
    return conError("Las contraseñas no coinciden.");
  }

  // Growwly trata datos de salud: solo mayores de edad (auditoría oct 2026).
  if (formData.get("mayor_edad") !== "on") {
    return conError("Para registrarte tienes que ser mayor de 18 años.");
  }
  if (edadRaw && (!/^\d{1,3}$/.test(edadRaw) || Number(edadRaw) < 18)) {
    return conError("Para registrarte tienes que ser mayor de 18 años.");
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
    return conError(
      error.message.toLowerCase().includes("already registered")
        ? "Ya hay una cuenta con este email. Inicia sesión con él."
        : error.message,
    );
  }

  // Si el proyecto tiene la confirmación por email activada (por defecto en
  // Supabase), todavía no hay sesión iniciada tras el signUp.
  if (!data.session) {
    redirect("/cuenta/registro/revisa-tu-email?tipo_cuenta=paciente");
  }

  if (claim && data.user) {
    const estudioId = await reclamarEstudio(data.user.id, claim);
    if (estudioId) {
      redirect(`/cuenta/analisis/${estudioId}`);
    }
  }

  redirect("/cuenta");
}
