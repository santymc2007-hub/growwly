"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function actualizarPerfil(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const ciudad = String(formData.get("ciudad") ?? "").trim();

  const dia = String(formData.get("nacimiento_dia") ?? "").trim();
  const mes = String(formData.get("nacimiento_mes") ?? "").trim();
  const anio = String(formData.get("nacimiento_anio") ?? "").trim();
  const fechaNacimiento =
    dia && mes && anio
      ? `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`
      : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      nombre: nombre || null,
      apellidos: apellidos || null,
      telefono: telefono || null,
      ciudad: ciudad || null,
      fecha_nacimiento: fechaNacimiento,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/cuenta?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/cuenta");
  redirect("/cuenta?guardado=1");
}

export async function cambiarEmail(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const nuevoEmail = String(formData.get("nuevo_email") ?? "").trim();
  if (!nuevoEmail) {
    redirect(`/cuenta?error=${encodeURIComponent("Escribe un email válido.")}`);
  }

  const { error } = await supabase.auth.updateUser({ email: nuevoEmail });

  if (error) {
    redirect(`/cuenta?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/cuenta");
  redirect(
    `/cuenta?guardado=1&aviso=${encodeURIComponent(
      "Revisa tu bandeja de entrada (la antigua y la nueva) para confirmar el cambio de email.",
    )}`,
  );
}

export async function cambiarPassword(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const password = String(formData.get("nueva_password") ?? "");
  const password2 = String(formData.get("nueva_password2") ?? "");

  if (!password || password.length < 6) {
    redirect(
      `/cuenta?error=${encodeURIComponent("La contraseña debe tener al menos 6 caracteres.")}`,
    );
  }
  if (password !== password2) {
    redirect(`/cuenta?error=${encodeURIComponent("Las contraseñas no coinciden.")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/cuenta?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/cuenta?guardado=1");
}

export async function cerrarSesionPaciente() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
