"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { uploadBlogPhoto, deleteBlogPhoto } from "@/lib/supabase/blog-storage";

const MAX_FAQS = 6;

function isRealFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function readFields(formData: FormData) {
  const str = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? String(value).trim() : null;
  };

  const faqs: { pregunta: string; respuesta: string }[] = [];
  for (let i = 0; i < MAX_FAQS; i++) {
    const pregunta = str(`faq_pregunta_${i}`);
    const respuesta = str(`faq_respuesta_${i}`);
    if (pregunta && respuesta) faqs.push({ pregunta, respuesta });
  }

  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    tecnica_relacionada: str("tecnica_relacionada"),
    categoria: str("categoria"),
    resumen: str("resumen"),
    contenido: String(formData.get("contenido") ?? ""),
    duracion_orientativa: str("duracion_orientativa"),
    publicado: formData.get("publicado") === "on",
    preguntas_frecuentes: faqs,
  };
}

export async function createTratamiento(formData: FormData) {
  const fields = readFields(formData);
  if (!fields.nombre) {
    redirect(
      `/admin/tratamientos/nuevo?error=${encodeURIComponent("El nombre es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();
  const slug = slugify(fields.nombre);

  let imagenPortada: string | null = null;
  const foto = formData.get("imagen_portada");
  if (isRealFile(foto)) {
    try {
      imagenPortada = await uploadBlogPhoto(supabase, foto);
    } catch (e) {
      redirect(
        `/admin/tratamientos/nuevo?error=${encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo subir la portada.",
        )}`,
      );
    }
  }

  const { error } = await supabase.from("tratamientos").insert({
    slug,
    nombre: fields.nombre,
    tecnica_relacionada: fields.tecnica_relacionada,
    categoria: fields.categoria,
    resumen: fields.resumen,
    contenido: fields.contenido,
    duracion_orientativa: fields.duracion_orientativa,
    publicado: fields.publicado,
    preguntas_frecuentes: fields.preguntas_frecuentes,
    imagen_portada: imagenPortada,
  });

  if (error) {
    redirect(`/admin/tratamientos/nuevo?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tratamientos");
  revalidatePath("/tratamientos");
  redirect("/admin/tratamientos");
}

export async function updateTratamiento(id: string, formData: FormData) {
  const fields = readFields(formData);
  if (!fields.nombre) {
    redirect(
      `/admin/tratamientos/${id}/editar?error=${encodeURIComponent("El nombre es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();

  const { data: actual } = await supabase
    .from("tratamientos")
    .select("imagen_portada")
    .eq("id", id)
    .maybeSingle();

  let imagenPortada = actual?.imagen_portada ?? null;
  const foto = formData.get("imagen_portada");
  if (isRealFile(foto)) {
    try {
      if (imagenPortada) await deleteBlogPhoto(supabase, imagenPortada);
      imagenPortada = await uploadBlogPhoto(supabase, foto);
    } catch (e) {
      redirect(
        `/admin/tratamientos/${id}/editar?error=${encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo subir la portada.",
        )}`,
      );
    }
  }

  const { error } = await supabase
    .from("tratamientos")
    .update({
      nombre: fields.nombre,
      tecnica_relacionada: fields.tecnica_relacionada,
    categoria: fields.categoria,
      resumen: fields.resumen,
      contenido: fields.contenido,
      duracion_orientativa: fields.duracion_orientativa,
      publicado: fields.publicado,
      preguntas_frecuentes: fields.preguntas_frecuentes,
      imagen_portada: imagenPortada,
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/tratamientos/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tratamientos");
  revalidatePath("/tratamientos");
  redirect("/admin/tratamientos");
}

export async function deleteTratamiento(id: string) {
  const supabase = createAdminClient();

  const { data: tratamiento } = await supabase
    .from("tratamientos")
    .select("imagen_portada")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("tratamientos").delete().eq("id", id);

  if (tratamiento?.imagen_portada) {
    await deleteBlogPhoto(supabase, tratamiento.imagen_portada);
  }

  revalidatePath("/admin/tratamientos");
  revalidatePath("/tratamientos");
}
