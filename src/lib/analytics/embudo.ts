import { leerAtribucion } from "@/lib/analytics/atribucion";
import type { PasoEmbudo } from "@/lib/analytics/embudo-pasos";

/**
 * Apunta un paso del embudo en nuestra propia base de datos
 * (embudo_eventos). No lleva ningún identificador de la persona, así que
 * se registra aunque no se acepten las cookies; el canal de origen solo
 * viaja si se aceptó la publicidad (es lo que permite guardarlo).
 */
export function registrarPaso(paso: PasoEmbudo, detalle?: string | number) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    paso,
    detalle: detalle === undefined ? undefined : String(detalle).slice(0, 120),
    atribucion: leerAtribucion(),
    consentimiento: window.growwlyConsent?.publicidad === true,
  });
  try {
    if (navigator.sendBeacon?.("/api/track/embudo", new Blob([body], { type: "application/json" }))) {
      return;
    }
  } catch {
    // Sin sendBeacon: se intenta con fetch.
  }
  fetch("/api/track/embudo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
