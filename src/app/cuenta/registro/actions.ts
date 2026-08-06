"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function registrarPaciente(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const edadRaw = String(formData.get("edad") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (!nombre || !email || !password) {
    redirect(
      `/cuenta/registro?error=${encodeURIComponent("Nombre, email y contraseña son obligatorios.")}`,
    );
  }

  if (password !== password2) {
    redirect(
      `/cuenta/registro?error=${encodeURIComponent("Las contraseñas no coinciden.")}`,
    );
  }

  const supabase = await createClient();
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
    },
  });

  if (error) {
    redirect(`/cuenta/registro?error=${encodeURIComponent(error.message)}`);
  }

  // Si el proyecto tiene la confirmación por email activada (por defecto en
  // Supabase), todavía no hay sesión iniciada tras el signUp.
  if (!data.session) {
    redirect("/cuenta/registro/revisa-tu-email");
  }

  redirect("/cuenta");
}
