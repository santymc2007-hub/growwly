import { canalDeAtribucion, type Atribucion } from "@/lib/analytics/atribucion";
import type { PasoEmbudo } from "@/lib/analytics/embudo-pasos";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Canal con el que se guarda un paso: sin consentimiento de publicidad
 * no hay atribución que leer, y se distingue de "directo" (que sí
 * aceptó y simplemente entró sin venir de ningún sitio).
 */
export function canalDelPaso(atribucion: Atribucion | null, consentimiento: boolean): string {
  if (atribucion) return canalDeAtribucion(atribucion);
  return consentimiento ? "directo" : "sin_consentimiento";
}

/** Apunta un paso del embudo desde el servidor. Nunca hace fallar la petición. */
export async function registrarPasoServidor(
  admin: Admin,
  paso: PasoEmbudo,
  opciones: {
    atribucion: Atribucion | null;
    consentimiento: boolean;
    detalle?: string | null;
    /** Canal cuando no hay atribución, si no vale el de por defecto. */
    canalSinAtribucion?: string;
  },
) {
  try {
    await admin.from("embudo_eventos").insert({
      paso,
      canal:
        !opciones.atribucion && opciones.canalSinAtribucion
          ? opciones.canalSinAtribucion
          : canalDelPaso(opciones.atribucion, opciones.consentimiento),
      campana: opciones.atribucion?.utm_campaign?.slice(0, 120) ?? null,
      detalle: opciones.detalle ? opciones.detalle.slice(0, 120) : null,
    });
  } catch {
    // El embudo es informativo: si falla, no se toca el flujo del usuario.
  }
}
