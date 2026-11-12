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

/**
 * Tipo de dispositivo a partir del user-agent, reducido a una de cuatro
 * categorías (nunca se guarda el user-agent): sirve para ver si un paso
 * falla en móvil, en escritorio o dentro del navegador de Instagram o
 * Facebook, que es donde se abren los anuncios de Meta.
 */
export function tipoDispositivo(userAgent: string | null): string | null {
  if (!userAgent) return null;
  if (/Instagram/i.test(userAgent)) return "app_instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i.test(userAgent)) return "app_facebook";
  if (/Mobi|Android|iPhone|iPod|iPad/i.test(userAgent)) return "movil";
  return "escritorio";
}

/** Apunta un paso del embudo desde el servidor. Nunca hace fallar la petición. */
export async function registrarPasoServidor(
  admin: Admin,
  paso: PasoEmbudo,
  opciones: {
    atribucion: Atribucion | null;
    consentimiento: boolean;
    detalle?: string | null;
    /** Categoría de dispositivo (ver tipoDispositivo). */
    dispositivo?: string | null;
    /** Canal cuando no hay atribución, si no vale el de por defecto. */
    canalSinAtribucion?: string;
  },
) {
  try {
    const fila = {
      paso,
      canal:
        !opciones.atribucion && opciones.canalSinAtribucion
          ? opciones.canalSinAtribucion
          : canalDelPaso(opciones.atribucion, opciones.consentimiento),
      campana: opciones.atribucion?.utm_campaign?.slice(0, 120) ?? null,
      detalle: opciones.detalle ? opciones.detalle.slice(0, 120) : null,
    };
    const { error } = await admin
      .from("embudo_eventos")
      .insert({ ...fila, dispositivo: opciones.dispositivo ?? null });
    // Si la columna dispositivo aún no existe en la base de datos (migración
    // sin aplicar), se guarda el paso sin ella para no perder el embudo.
    if (error) await admin.from("embudo_eventos").insert(fila);
  } catch {
    // El embudo es informativo: si falla, no se toca el flujo del usuario.
  }
}
