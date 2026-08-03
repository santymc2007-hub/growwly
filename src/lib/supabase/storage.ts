import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const BUCKET = "clinic-photos";

/**
 * Sube cada archivo al bucket de fotos y devuelve sus URLs públicas,
 * listas para guardar en el campo `fotos` de la clínica.
 */
export async function uploadClinicPhotos(
  supabase: SupabaseClient<Database>,
  files: File[],
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

    if (error) {
      throw new Error(`No se pudo subir "${file.name}": ${error.message}`);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

/** Extrae la ruta interna del objeto a partir de su URL pública. */
function getStoragePath(publicUrl: string): string | null {
  const marker = `/${BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  return index === -1 ? null : publicUrl.slice(index + marker.length);
}

/** Borra del Storage las fotos correspondientes a esas URLs públicas. */
export async function deleteClinicPhotos(
  supabase: SupabaseClient<Database>,
  publicUrls: string[],
): Promise<void> {
  const paths = publicUrls
    .map(getStoragePath)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }
}
