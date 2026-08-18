"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  uploadHeroSlidePhoto,
  deleteHeroSlidePhoto,
} from "@/lib/supabase/hero-slides-storage";
import { sanitizeTitularHtml } from "./sanitize-titular";

function isRealFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function readSlideFields(formData: FormData) {
  const str = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? String(value).trim() : null;
  };

  const titularHtml = sanitizeTitularHtml(
    String(formData.get("titular_html") ?? "").trim(),
  );
  // Texto plano del titular, solo para validar que no está vacío.
  const titularTexto = titularHtml.replace(/<[^>]+>/g, "").trim();

  return {
    titular_html: titularHtml,
    titular_texto: titularTexto,
    subtitulo: str("subtitulo"),
    color_fondo: str("color_fondo") ?? "#ecf7f1",
    enlace: str("enlace") ?? "/analisis/nuevo",
    texto_boton: str("texto_boton") ?? "Subir fotos",
    activo: formData.get("activo") === "on",
  };
}

export async function createSlide(formData: FormData) {
  const fields = readSlideFields(formData);
  if (!fields.titular_texto) {
    redirect(
      `/admin/hero-slides/nuevo?error=${encodeURIComponent(
        "El titular es obligatorio.",
      )}`,
    );
  }

  const supabase = createAdminClient();

  let imagenUrl: string | null = null;
  const foto = formData.get("imagen");
  if (isRealFile(foto)) {
    try {
      imagenUrl = await uploadHeroSlidePhoto(supabase, foto);
    } catch (e) {
      redirect(
        `/admin/hero-slides/nuevo?error=${encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo subir la imagen.",
        )}`,
      );
    }
  }

  // Nueva slide al final del orden actual.
  const { count } = await supabase
    .from("hero_slides")
    .select("id", { count: "exact", head: true });

  const { error } = await supabase.from("hero_slides").insert({
    orden: count ?? 0,
    titular_html: fields.titular_html,
    subtitulo: fields.subtitulo,
    color_fondo: fields.color_fondo,
    imagen_url: imagenUrl,
    enlace: fields.enlace,
    texto_boton: fields.texto_boton,
    activo: fields.activo,
  });

  if (error) {
    redirect(
      `/admin/hero-slides/nuevo?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin/hero-slides");
  revalidatePath("/");
  redirect("/admin/hero-slides");
}

export async function updateSlide(id: string, formData: FormData) {
  const fields = readSlideFields(formData);
  if (!fields.titular_texto) {
    redirect(
      `/admin/hero-slides/${id}/editar?error=${encodeURIComponent(
        "El titular es obligatorio.",
      )}`,
    );
  }

  const supabase = createAdminClient();

  const { data: actual } = await supabase
    .from("hero_slides")
    .select("imagen_url")
    .eq("id", id)
    .maybeSingle();

  let imagenUrl = actual?.imagen_url ?? null;
  const foto = formData.get("imagen");
  if (isRealFile(foto)) {
    try {
      await deleteHeroSlidePhoto(supabase, imagenUrl);
      imagenUrl = await uploadHeroSlidePhoto(supabase, foto);
    } catch (e) {
      redirect(
        `/admin/hero-slides/${id}/editar?error=${encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo subir la imagen.",
        )}`,
      );
    }
  }

  const { error } = await supabase
    .from("hero_slides")
    .update({
      titular_html: fields.titular_html,
      subtitulo: fields.subtitulo,
      color_fondo: fields.color_fondo,
      imagen_url: imagenUrl,
      enlace: fields.enlace,
      texto_boton: fields.texto_boton,
      activo: fields.activo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/hero-slides/${id}/editar?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/admin/hero-slides");
  revalidatePath("/");
  redirect("/admin/hero-slides");
}

export async function deleteSlide(id: string) {
  const supabase = createAdminClient();

  const { data: slide } = await supabase
    .from("hero_slides")
    .select("imagen_url")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("hero_slides").delete().eq("id", id);

  if (slide?.imagen_url) {
    await deleteHeroSlidePhoto(supabase, slide.imagen_url);
  }

  revalidatePath("/admin/hero-slides");
  revalidatePath("/");
}

export async function toggleActivo(id: string, next: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("hero_slides")
    .update({ activo: next })
    .eq("id", id);

  if (!error) {
    revalidatePath("/admin/hero-slides");
    revalidatePath("/");
  }
}

export async function moveSlide(id: string, direction: "up" | "down") {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("hero_slides")
    .select("id")
    .order("orden", { ascending: true });

  const list = data ?? [];
  const index = list.findIndex((s) => s.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return;

  [list[index], list[swapIndex]] = [list[swapIndex], list[index]];

  // Reasignamos un orden secuencial a toda la lista: así el movimiento
  // funciona siempre, aunque varias filas partieran con el mismo valor.
  await Promise.all(
    list.map((s, i) =>
      supabase.from("hero_slides").update({ orden: i }).eq("id", s.id),
    ),
  );

  revalidatePath("/admin/hero-slides");
  revalidatePath("/");
}
