"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolverSlug, actualizarSlugsAnteriores } from "@/lib/seo/slug-editable";
import { uploadBlogPhoto, deleteBlogPhoto } from "@/lib/supabase/blog-storage";

const MAX_FAQS = 6;
const MAX_DESTACADOS_HOME = 4;

function isRealFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

/** Máximo 4 tratamientos marcados como destacados en home a la vez. */
async function superaLimiteDestacados(
  supabase: ReturnType<typeof createAdminClient>,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from("tratamientos")
    .select("id", { count: "exact", head: true })
    .eq("destacado_home", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { count } = await query;
  return (count ?? 0) >= MAX_DESTACADOS_HOME;
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
    destacado_home: formData.get("destacado_home") === "on",
    slug: str("slug"),
    meta_title: str("meta_title"),
    meta_description: str("meta_description"),
  };
}

export async function createTratamiento(formData: FormData) {
  await requireAdmin();
  const fields = readFields(formData);
  if (!fields.nombre) {
    redirect(
      `/admin/tratamientos/nuevo?error=${encodeURIComponent("El nombre es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();

  if (fields.destacado_home && (await superaLimiteDestacados(supabase))) {
    redirect(
      `/admin/tratamientos/nuevo?error=${encodeURIComponent(
        `Ya hay ${MAX_DESTACADOS_HOME} tratamientos destacados en la home. Quita uno antes de añadir otro.`,
      )}`,
    );
  }

  const resultadoSlug = await resolverSlug(supabase, "tratamientos", fields.slug, fields.nombre);
  if (resultadoSlug.error) {
    redirect(`/admin/tratamientos/nuevo?error=${encodeURIComponent(resultadoSlug.error)}`);
  }
  const slug = resultadoSlug.slug!;

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
    meta_title: fields.meta_title,
    meta_description: fields.meta_description,
    nombre: fields.nombre,
    tecnica_relacionada: fields.tecnica_relacionada,
    categoria: fields.categoria,
    resumen: fields.resumen,
    contenido: fields.contenido,
    duracion_orientativa: fields.duracion_orientativa,
    publicado: fields.publicado,
    preguntas_frecuentes: fields.preguntas_frecuentes,
    imagen_portada: imagenPortada,
    destacado_home: fields.destacado_home,
  });

  if (error) {
    redirect(`/admin/tratamientos/nuevo?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tratamientos");
  revalidatePath("/tratamientos");
  redirect("/admin/tratamientos");
}

export async function updateTratamiento(id: string, formData: FormData) {
  await requireAdmin();
  const fields = readFields(formData);
  if (!fields.nombre) {
    redirect(
      `/admin/tratamientos/${id}/editar?error=${encodeURIComponent("El nombre es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();

  if (
    fields.destacado_home &&
    (await superaLimiteDestacados(supabase, id))
  ) {
    redirect(
      `/admin/tratamientos/${id}/editar?error=${encodeURIComponent(
        `Ya hay ${MAX_DESTACADOS_HOME} tratamientos destacados en la home. Quita uno antes de añadir otro.`,
      )}`,
    );
  }

  const { data: actual } = await supabase
    .from("tratamientos")
    .select("imagen_portada, slug, slugs_anteriores")
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

  const resultadoSlug = await resolverSlug(supabase, "tratamientos", fields.slug, fields.nombre, id);
  if (resultadoSlug.error) {
    redirect(`/admin/tratamientos/${id}/editar?error=${encodeURIComponent(resultadoSlug.error)}`);
  }
  const slug = resultadoSlug.slug!;
  const slugsAnteriores = actualizarSlugsAnteriores(actual?.slugs_anteriores, actual?.slug, slug);

  const { error } = await supabase
    .from("tratamientos")
    .update({
      slug,
      slugs_anteriores: slugsAnteriores,
      meta_title: fields.meta_title,
      meta_description: fields.meta_description,
      nombre: fields.nombre,
      tecnica_relacionada: fields.tecnica_relacionada,
    categoria: fields.categoria,
      resumen: fields.resumen,
      contenido: fields.contenido,
      duracion_orientativa: fields.duracion_orientativa,
      publicado: fields.publicado,
      preguntas_frecuentes: fields.preguntas_frecuentes,
      imagen_portada: imagenPortada,
      destacado_home: fields.destacado_home,
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/tratamientos/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/tratamientos");
  revalidatePath("/tratamientos");
  revalidatePath(`/tratamientos/${slug}`);
  if (actual?.slug && actual.slug !== slug) revalidatePath(`/tratamientos/${actual.slug}`);
  redirect("/admin/tratamientos");
}

export async function deleteTratamiento(id: string) {
  await requireAdmin();
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
