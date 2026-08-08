"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Comprueba que el usuario es una clínica aprobada y devuelve su clinic_id. */
async function requireClinicaAprobada(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/clinica/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, clinic_id, clinic_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.role !== "clinic" ||
    profile.clinic_status !== "aprobado" ||
    !profile.clinic_id
  ) {
    redirect("/clinica");
  }

  return profile.clinic_id;
}

export async function actualizarMiFicha(formData: FormData) {
  const clinicId = await requireClinicaAprobada();

  const str = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? String(value).trim() : null;
  };
  const num = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? Number(value) : null;
  };

  const redesSociales: Record<string, string> = {};
  for (const key of ["instagram", "facebook", "tiktok"]) {
    const value = formData.get(`red_${key}`);
    if (value && String(value).trim() !== "") {
      redesSociales[key] = String(value).trim();
    }
  }

  const servicios = String(formData.get("servicios_adicionales") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const detalleOferta = str("detalle_oferta");

  // Solo estos campos — nunca verificado, destacado, orden, ratings,
  // ni publicado (eso tiene su propia acción con su propia pantalla).
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clinics")
    .update({
      descripcion: str("descripcion"),
      telefono: str("telefono"),
      email: str("email"),
      web: str("web"),
      direccion: str("direccion"),
      ciudad: str("ciudad"),
      zona: str("zona"),
      redes_sociales: redesSociales,
      tecnicas: formData.getAll("tecnicas").map(String),
      idiomas: formData.getAll("idiomas").map(String),
      tipo_negocio: str("tipo_negocio"),
      servicios_adicionales: servicios,
      precio_desde: num("precio_desde"),
      precio_hasta: num("precio_hasta"),
      rango_precios: str("rango_precios"),
      horarios: str("horarios"),
      accesibilidad: str("accesibilidad"),
      financiacion: formData.get("financiacion") === "on",
      primera_consulta_gratis: formData.get("primera_consulta_gratis") === "on",
      tiene_oferta: Boolean(detalleOferta),
      detalle_oferta: detalleOferta,
    })
    .eq("id", clinicId);

  if (error) {
    redirect(`/clinica/ficha?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/clinica/ficha");
  revalidatePath("/clinicas");
  redirect("/clinica/ficha?guardado=1");
}

export async function cambiarPublicacion(publicar: boolean) {
  const clinicId = await requireClinicaAprobada();

  const supabase = createAdminClient();
  await supabase
    .from("clinics")
    .update({ publicado: publicar })
    .eq("id", clinicId);

  revalidatePath("/clinica/ficha");
  revalidatePath("/clinicas");
  redirect("/clinica/ficha");
}
