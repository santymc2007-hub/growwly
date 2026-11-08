import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { sanearSvg } from "@/lib/seguridad/sanear-svg";

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
    // Los SVG (logos, iconos) pueden llevar scripts: se sanean siempre en
    // servidor antes de guardarlos, vengan con el tipo que vengan.
    const esSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
    let contenido: File | Blob = file;
    if (esSvg) {
      const resultado = sanearSvg(await file.text());
      if (!resultado.ok) {
        throw new Error(`No se pudo subir "${file.name}": ${resultado.motivo}`);
      }
      contenido = new Blob([resultado.svg], { type: "image/svg+xml" });
    }

    const ext = esSvg ? "svg" : file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, contenido, {
      contentType: esSvg ? "image/svg+xml" : file.type || undefined,
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
