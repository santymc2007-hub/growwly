"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { uploadBlogPhoto, deleteBlogPhoto } from "@/lib/supabase/blog-storage";

function isRealFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function readPostFields(formData: FormData) {
  const str = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? String(value).trim() : null;
  };

  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    resumen: str("resumen"),
    contenido: String(formData.get("contenido") ?? ""),
    autor: str("autor") ?? "Growwly",
    publicado: formData.get("publicado") === "on",
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
    autor: fields.autor,
    publicado: fields.publicado,
    publicado_en: fields.publicado ? new Date().toISOString() : null,
    imagen_portada: imagenPortada,
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
      autor: fields.autor,
      publicado: fields.publicado,
      imagen_portada: imagenPortada,
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
