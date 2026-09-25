"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { uploadBlogPhoto, deleteBlogPhoto } from "@/lib/supabase/blog-storage";

const MAX_FAQS = 6;
const MAX_DESTACADOS_HOME = 4;

function isRealFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

/** Máximo 4 entradas marcadas como destacadas en home a la vez. */
async function superaLimiteDestacados(
  supabase: ReturnType<typeof createAdminClient>,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("destacado_home", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { count } = await query;
  return (count ?? 0) >= MAX_DESTACADOS_HOME;
}

function readPostFields(formData: FormData) {
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

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    resumen: str("resumen"),
    contenido: String(formData.get("contenido") ?? ""),
    autor: str("autor") ?? "El equipo de Growwly",
    autor_cargo: str("autor_cargo"),
    publicado: formData.get("publicado") === "on",
    preguntas_frecuentes: faqs,
    tags,
    destacado_home: formData.get("destacado_home") === "on",
  };
}

export async function createPost(formData: FormData) {
  const fields = readPostFields(formData);
  if (!fields.titulo) {
    redirect(
      `/admin/blog/nuevo?error=${encodeURIComponent("El título es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();

  if (fields.destacado_home && (await superaLimiteDestacados(supabase))) {
    redirect(
      `/admin/blog/nuevo?error=${encodeURIComponent(
        `Ya hay ${MAX_DESTACADOS_HOME} entradas destacadas en la home. Quita una antes de añadir otra.`,
      )}`,
    );
  }

  const slug = slugify(fields.titulo);

  let imagenPortada: string | null = null;
  const foto = formData.get("imagen_portada");
  if (isRealFile(foto)) {
    try {
      imagenPortada = await uploadBlogPhoto(supabase, foto);
    } catch (e) {
      redirect(
        `/admin/blog/nuevo?error=${encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo subir la portada.",
        )}`,
      );
    }
  }

  const { error } = await supabase.from("blog_posts").insert({
    slug,
    titulo: fields.titulo,
    resumen: fields.resumen,
    contenido: fields.contenido,
    preguntas_frecuentes: fields.preguntas_frecuentes,
    autor: fields.autor,
    autor_cargo: fields.autor_cargo,
    publicado: fields.publicado,
    publicado_en: fields.publicado ? new Date().toISOString() : null,
    imagen_portada: imagenPortada,
    tags: fields.tags,
    destacado_home: fields.destacado_home,
  });

  if (error) {
    redirect(`/admin/blog/nuevo?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function updatePost(id: string, formData: FormData) {
  const fields = readPostFields(formData);
  if (!fields.titulo) {
    redirect(
      `/admin/blog/${id}/editar?error=${encodeURIComponent("El título es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();

  if (
    fields.destacado_home &&
    (await superaLimiteDestacados(supabase, id))
  ) {
    redirect(
      `/admin/blog/${id}/editar?error=${encodeURIComponent(
        `Ya hay ${MAX_DESTACADOS_HOME} entradas destacadas en la home. Quita una antes de añadir otra.`,
      )}`,
    );
  }

  const { data: actual } = await supabase
    .from("blog_posts")
    .select("imagen_portada, publicado, publicado_en")
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
        `/admin/blog/${id}/editar?error=${encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo subir la portada.",
        )}`,
      );
    }
  }

  // Si se publica por primera vez ahora, fijamos la fecha de publicación.
  const sePublicaPorPrimeraVez = fields.publicado && !actual?.publicado_en;

  const { error } = await supabase
    .from("blog_posts")
    .update({
      titulo: fields.titulo,
      resumen: fields.resumen,
      contenido: fields.contenido,
      preguntas_frecuentes: fields.preguntas_frecuentes,
      autor: fields.autor,
      autor_cargo: fields.autor_cargo,
      publicado: fields.publicado,
      imagen_portada: imagenPortada,
      tags: fields.tags,
      destacado_home: fields.destacado_home,
      ...(sePublicaPorPrimeraVez && {
        publicado_en: new Date().toISOString(),
      }),
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/blog/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deletePost(id: string) {
  const supabase = createAdminClient();

  const { data: post } = await supabase
    .from("blog_posts")
    .select("imagen_portada")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("blog_posts").delete().eq("id", id);

  if (post?.imagen_portada) {
    await deleteBlogPhoto(supabase, post.imagen_portada);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
