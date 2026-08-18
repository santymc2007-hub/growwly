import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const BUCKET = "hero-slides";

/** Sube la imagen de una slide del hero y devuelve su URL pública. */
export async function uploadHeroSlidePhoto(
  supabase: SupabaseClient<Database>,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function getStoragePath(publicUrl: string): string | null {
  const marker = `/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  return index === -1 ? null : publicUrl.slice(index + marker.length);
}

export async function deleteHeroSlidePhoto(
  supabase: SupabaseClient<Database>,
  url: string | null,
): Promise<void> {
  // Las slides con imagen "de fábrica" (/brand/...) no viven en Storage.
  if (!url || !url.includes(`/${BUCKET}/`)) return;
  const path = getStoragePath(url);
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }
}
