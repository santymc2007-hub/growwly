"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizarFondo, obtenerFondoWeb } from "@/lib/ajustes/fondo";

// Las imágenes de fondo van al bucket público que ya usaba el hero,
// en su propia carpeta.
const BUCKET = "hero-slides";
const CARPETA = "fondos";
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

function volver(mensaje: string, ok = false): never {
  redirect(`/admin/personalizar?${ok ? "guardado" : "error"}=${encodeURIComponent(mensaje)}`);
}

export async function guardarFondo(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();
  const actual = await obtenerFondoWeb();

  // "Restaurar el fondo original" envía restaurar=1.
  const restaurar = formData.get("restaurar") === "1";

  let imagenUrl = actual.imagenUrl;
  const archivo = formData.get("imagen");
  if (!restaurar && archivo instanceof File && archivo.size > 0) {
    if (!TIPOS_IMAGEN.includes(archivo.type)) volver("La imagen tiene que ser JPG, PNG, WebP o AVIF.");
    if (archivo.size > MAX_BYTES) volver("La imagen pesa más de 8 MB. Redúcela un poco y vuelve a subirla.");

    const ext = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${CARPETA}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, archivo, {
      contentType: archivo.type,
      upsert: false,
    });
    if (error) volver(`No se pudo subir la imagen: ${error.message}`);
    imagenUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const fondo = restaurar
    ? normalizarFondo({ ...actual, tipo: "original", velo: 0 })
    : normalizarFondo({
        tipo: formData.get("tipo"),
        imagenUrl,
        color: formData.get("color"),
        modo: formData.get("modo"),
        velo: formData.get("velo"),
      });

  if (!restaurar && formData.get("tipo") === "imagen" && !fondo.imagenUrl) {
    volver("Sube una imagen para usarla de fondo.");
  }

  const { error } = await supabase
    .from("ajustes_web")
    .upsert({ clave: "fondo", valor: fondo, updated_at: new Date().toISOString() });
  if (error) volver(`No se pudo guardar: ${error.message}`);

  // El fondo sale en todas las páginas.
  revalidatePath("/", "layout");
  volver(restaurar ? "Fondo original restaurado." : "Fondo guardado. Ya se ve en toda la web.", true);
}
