"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { borrarFotosEstudio } from "@/lib/supabase/estudios-storage";

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
      acepta_marketing_email: formData.get("acepta_marketing_email") === "on",
      acepta_recordatorios_email: formData.get("acepta_recordatorios_email") === "on",
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

/**
 * El paciente borra su cuenta y todo lo suyo: valoraciones (y sus
 * fotos del bucket privado), solicitudes de presupuesto y, por cascada
 * en la base de datos, los leads, propuestas y eventos asociados. La
 * política de privacidad promete hacerlo en 30 días como mucho; se
 * hace al momento.
 *
 * Solo cuentas de paciente: una cuenta de clínica o de admin tiene
 * fichas y datos de facturación detrás y se da de baja escribiendo a
 * Growwly.
 */
export async function eliminarCuenta() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const admin = createAdminClient();
  const { data: perfil } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil && perfil.role !== "patient") {
    redirect(
      `/cuenta?error=${encodeURIComponent(
        "Las cuentas de clínica se dan de baja escribiendo a direccion@growwly.es.",
      )}`,
    );
  }

  // Las fotos viven en Storage, fuera de la cascada de la base de datos.
  const { data: estudios } = await admin
    .from("estudios_capilares")
    .select(
      "foto_frontal, foto_donante, foto_coronilla, foto_perfil_derecho, foto_perfil_izquierdo, fotos_adicionales",
    )
    .eq("user_id", user.id);

  const rutas = (estudios ?? []).flatMap((e) => [
    e.foto_frontal,
    e.foto_donante,
    e.foto_coronilla,
    e.foto_perfil_derecho,
    e.foto_perfil_izquierdo,
    ...(e.fotos_adicionales ?? []),
  ]);
  await borrarFotosEstudio(admin, rutas);

  // Borrar el usuario de Auth arrastra profiles → estudios_capilares,
  // solicitudes_presupuesto → leads_clinica, propuestas, eventos.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    redirect(
      `/cuenta?error=${encodeURIComponent(
        "No se ha podido eliminar la cuenta. Inténtalo de nuevo o escríbenos a direccion@growwly.es.",
      )}`,
    );
  }

  await supabase.auth.signOut();
  redirect("/?cuenta_eliminada=1");
}

export async function cerrarSesionPaciente() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
