"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { uploadClinicPhotos, deleteClinicPhotos } from "@/lib/supabase/storage";
import type { Database } from "@/lib/supabase/database.types";

type ClinicWrite = Omit<
  Database["public"]["Tables"]["clinics"]["Insert"],
  "id" | "slug" | "created_at" | "updated_at" | "fotos"
>;

function isRealFile(value: FormDataEntryValue): value is File {
  return value instanceof File && value.size > 0;
}

function readClinicFields(formData: FormData): ClinicWrite {
  const num = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? Number(value) : null;
  };
  const str = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? String(value).trim() : null;
  };

  const redesSociales: Record<string, string> = {};
  for (const key of ["instagram", "facebook", "tiktok"]) {
    const value = formData.get(`red_${key}`);
    if (value && String(value).trim() !== "") {
      redesSociales[key] = String(value).trim();
    }
  }

  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    descripcion: str("descripcion"),
    comunidad_autonoma: str("comunidad_autonoma"),
    provincia: str("provincia"),
    ciudad: str("ciudad"),
    zona: str("zona"),
    lat: num("lat"),
    lng: num("lng"),
    telefono: str("telefono"),
    email: str("email"),
    web: str("web"),
    redes_sociales: redesSociales,
    tecnicas: formData.getAll("tecnicas").map(String),
    idiomas: formData.getAll("idiomas").map(String),
    financiacion: formData.get("financiacion") === "on",
    primera_consulta_gratis: formData.get("primera_consulta_gratis") === "on",
    verificado: formData.get("verificado") === "on",
    publicado: formData.get("publicado") === "on",
    destacado: formData.get("destacado") === "on",
    plan: str("plan") ?? "basico",
    destacado_home: formData.get("destacado_home") === "on",
    destacado_ciudad: formData.get("destacado_ciudad") === "on",
    direccion: str("direccion"),
    rango_precios: str("rango_precios"),
    precio_desde: num("precio_desde"),
    precio_hasta: num("precio_hasta"),
    accesibilidad: str("accesibilidad"),
    horarios_estructurados: (() => {
      try {
        return JSON.parse(String(formData.get("horarios_estructurados") ?? "[]"));
      } catch {
        return [];
      }
    })(),
    rating_google: num("rating_google"),
    resenas_google: num("resenas_google"),
    rating_doctoralia: num("rating_doctoralia"),
    resenas_doctoralia: num("resenas_doctoralia"),
    tipo_negocio: str("tipo_negocio"),
    servicios_adicionales: String(formData.get("servicios_adicionales") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    tiene_oferta: Boolean(str("detalle_oferta")),
    detalle_oferta: str("detalle_oferta"),
  };
}

export async function createClinic(formData: FormData) {
  const fields = readClinicFields(formData);

  if (!fields.nombre) {
    redirect(
      `/admin/clinicas/nueva?error=${encodeURIComponent("El nombre es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();

  let fotos: string[] = [];
  try {
    const nuevas = formData.getAll("fotos_nuevas").filter(isRealFile);
    fotos = await uploadClinicPhotos(supabase, nuevas);
  } catch (uploadError) {
    const message =
      uploadError instanceof Error ? uploadError.message : "No se pudieron subir las fotos.";
    redirect(`/admin/clinicas/nueva?error=${encodeURIComponent(message)}`);
  }

  const { error } = await supabase.from("clinics").insert({
    ...fields,
    slug: slugify(fields.nombre),
    fotos,
  });

  if (error) {
    redirect(`/admin/clinicas/nueva?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/clinicas");
  revalidatePath("/clinicas");
  redirect("/admin/clinicas");
}

export async function deleteClinic(id: string) {
  const supabase = createAdminClient();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("fotos")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("clinics").delete().eq("id", id);

  if (error) {
    redirect(`/admin/clinicas?error=${encodeURIComponent(error.message)}`);
  }

  if (clinic?.fotos?.length) {
    try {
      await deleteClinicPhotos(supabase, clinic.fotos);
    } catch {
      // La clínica ya se borró; si sobran archivos huérfanos en el
      // Storage no es crítico, se pueden limpiar luego a mano.
    }
  }

  revalidatePath("/admin/clinicas");
  revalidatePath("/clinicas");
}

export async function updateClinic(id: string, formData: FormData) {
  const fields = readClinicFields(formData);

  if (!fields.nombre) {
    redirect(
      `/admin/clinicas/${id}/editar?error=${encodeURIComponent("El nombre es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();

  const fotosActuales: string[] = JSON.parse(
    String(formData.get("fotos_actuales") ?? "[]"),
  );
  const aEliminar = formData.getAll("fotos_eliminar").map(String);
  const conservadas = fotosActuales.filter((url) => !aEliminar.includes(url));

  let nuevas: string[] = [];
  try {
    const archivos = formData.getAll("fotos_nuevas").filter(isRealFile);
    nuevas = await uploadClinicPhotos(supabase, archivos);
  } catch (uploadError) {
    const message =
      uploadError instanceof Error ? uploadError.message : "No se pudieron subir las fotos.";
    redirect(`/admin/clinicas/${id}/editar?error=${encodeURIComponent(message)}`);
  }

  if (aEliminar.length > 0) {
    await deleteClinicPhotos(supabase, aEliminar);
  }

  // El slug no se toca aquí: se generó al crear la clínica y no queremos
  // romper enlaces existentes a /clinicas/[slug] al editar otros campos.
  // Guardar desde aquí resuelve cualquier solicitud pendiente de la
  // clínica (tanto si la aprobaste marcando la casilla, como si la
  // rechazaste dejándola desmarcada).
  const { error } = await supabase
    .from("clinics")
    .update({
      ...fields,
      fotos: [...conservadas, ...nuevas],
      destacado_solicitado: false,
      destacado_home_solicitado: false,
      destacado_ciudad_solicitado: false,
      plan_solicitado: null,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/clinicas/${id}/editar?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin/clinicas");
  revalidatePath("/clinicas");
  redirect("/admin/clinicas");
}

export async function toggleDestacado(id: string, next: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clinics")
    .update({ destacado: next })
    .eq("id", id);

  if (!error) {
    revalidatePath("/admin/clinicas");
    revalidatePath("/clinicas");
  }
}

export async function moveClinic(id: string, direction: "up" | "down") {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("clinics")
    .select("id, destacado")
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const list = data ?? [];
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return;
  // No cruzar entre el grupo de destacadas y el resto.
  if (list[index].destacado !== list[swapIndex].destacado) return;

  [list[index], list[swapIndex]] = [list[swapIndex], list[index]];

  // Reasignamos un orden secuencial a toda la lista: así el movimiento
  // funciona siempre, aunque varias filas partieran con el mismo valor.
  await Promise.all(
    list.map((c, i) =>
      supabase.from("clinics").update({ orden: i }).eq("id", c.id),
    ),
  );

  revalidatePath("/admin/clinicas");
  revalidatePath("/clinicas");
}
