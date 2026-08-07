import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const BUCKET = "estudios-capilares";

/**
 * Sube una foto de estudio a la carpeta del propio usuario dentro del
 * bucket privado y devuelve la ruta interna (no una URL pública: el
 * bucket es privado).
 */
export async function subirFotoEstudio(
  supabase: SupabaseClient<Database>,
  userId: string,
  angulo: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${angulo}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    throw new Error(`No se pudo subir la foto (${angulo}): ${error.message}`);
  }

  return path;
}

/** Genera una URL firmada temporal (1 hora) para mostrar una foto privada. */
export async function urlFirmadaFoto(
  supabase: SupabaseClient<Database>,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
