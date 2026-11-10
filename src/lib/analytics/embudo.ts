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

/** Parámetros de campaña que se leen de la URL (sin cookies ni almacenamiento). */
const UTM_URL = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
/** Identificadores de clic: solo se manda que estaban, nunca su valor. */
const CLIC_URL = ["gclid", "gbraid", "wbraid", "fbclid"] as const;

/**
 * Origen de campaña de la URL actual, o null si no trae ninguno. Los
 * identificadores de clic se reducen a "1" para no mandar nada que
 * permita reconocer a la persona.
 */
export function origenDeLaUrl(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const origen: Record<string, string> = {};
  for (const p of UTM_URL) {
    const v = params.get(p);
    if (v) origen[p] = v.slice(0, 120);
  }
  for (const p of CLIC_URL) {
    if (params.get(p)) origen[p] = "1";
  }
  return Object.keys(origen).length > 0 ? origen : null;
}

function enviarConOrigen(paso: PasoEmbudo, origen: Record<string, string> | null, detalle: string) {
  const body = JSON.stringify({ paso, origen, detalle: detalle.slice(0, 120) });
  try {
    if (navigator.sendBeacon?.("/api/track/embudo", new Blob([body], { type: "application/json" }))) return;
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

// Una sola vez por URL de llegada en esta pestaña (los re-renders y la
// navegación interna no vuelven a contar).
const llegadasContadas = new Set<string>();

/**
 * Cuenta que alguien ha llegado a la web con parámetros de campaña
 * (anuncios de Meta o Google, enlaces con UTM). Se registra aunque no
 * acepte las cookies: es un contador sin identificadores, para comparar
 * los clics que dicen los anuncios con las visitas que de verdad cargan.
 */
export function registrarLlegada() {
  const origen = origenDeLaUrl();
  if (!origen) return;
  const clave = window.location.pathname + window.location.search;
  if (llegadasContadas.has(clave)) return;
  llegadasContadas.add(clave);
  enviarConOrigen("llegada_anuncio", origen, `${origen.utm_content ?? "-"} · ${window.location.pathname}`);
}

/** Qué elige en el banner de cookies, con el origen de la página en la que lo decide. */
export function registrarDecisionCookies(analitica: boolean, publicidad: boolean | null) {
  const detalle =
    analitica && publicidad !== false
      ? "acepta todo"
      : !analitica && !publicidad
        ? "rechaza todo"
        : `elige: analítica ${analitica ? "sí" : "no"}, publicidad ${publicidad ? "sí" : "no"}`;
  enviarConOrigen("cookies_decision", origenDeLaUrl(), detalle);
}
