import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const BUCKET = "blog-photos";

/** Sube la imagen de portada y devuelve su URL pública. */
export async function uploadBlogPhoto(
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
    throw new Error(`No se pudo subir la portada: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function getStoragePath(publicUrl: string): string | null {
  const marker = `/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  return index === -1 ? null : publicUrl.slice(index + marker.length);
}

export async function deleteBlogPhoto(
  supabase: SupabaseClient<Database>,
  url: string | null,
): Promise<void> {
  if (!url) return;
  const path = getStoragePath(url);
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }
}
