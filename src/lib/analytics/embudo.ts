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
  // Al cargar una página, el banner de cookies publica la elección
  // guardada un instante después de que se monten los formularios: se
  // espera a que esté (máx. 3 s) para no perder el canal de origen.
  if (window.growwlyConsent === undefined) {
    const inicio = Date.now();
    const esperar = () => {
      if (window.growwlyConsent !== undefined || Date.now() - inicio > 3000) enviar(paso, detalle);
      else window.setTimeout(esperar, 100);
    };
    window.setTimeout(esperar, 100);
    return;
  }
  enviar(paso, detalle);
}

function enviar(paso: PasoEmbudo, detalle?: string | number) {
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
