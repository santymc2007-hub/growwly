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
  const edadRaw = String(formData.get("edad") ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({
      nombre: nombre || null,
      apellidos: apellidos || null,
      telefono: telefono || null,
      edad: edadRaw ? Number(edadRaw) : null,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/cuenta?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/cuenta");
  redirect("/cuenta?guardado=1");
}

export async function cerrarSesionPaciente() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
