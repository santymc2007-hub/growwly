/**
 * Atribución de leads: de qué anuncio o campaña viene cada solicitud.
 *
 * Al llegar a la web con parámetros de campaña (gclid, fbclid, utm_…)
 * se guardan en el navegador y se mandan junto con la solicitud, para
 * poder ver en la base de datos qué campañas traen leads que de verdad
 * acaban en un centro. Solo con consentimiento de publicidad: sin él no
 * se guarda ni se envía nada.
 *
 * Modelo "último clic no directo": una visita nueva con parámetros, o
 * que llega desde otra web (Google, Instagram, un blog…), sustituye a la
 * anterior; entrar tecleando la dirección no borra nada. De las visitas
 * desde otra web solo se guarda el dominio (`referrer`), nunca la URL
 * completa. Caduca a los 90 días, como las cookies de los anuncios.
 */

export const CLAVE_ATRIBUCION = "growwly_atribucion";
const VALIDEZ_MS = 90 * 24 * 60 * 60 * 1000;

export const PARAMETROS_ATRIBUCION = [
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type Atribucion = Partial<Record<(typeof PARAMETROS_ATRIBUCION)[number], string>> & {
  /** Dominio de la web desde la que llegó, si no traía parámetros. */
  referrer?: string;
  landing?: string;
  fecha?: string;
};

/** Dominio de la web anterior, si es externa a Growwly. */
function referrerExterno(): string | null {
  if (!document.referrer) return null;
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (!host || host === window.location.hostname || host.endsWith("growwly.es")) return null;
    // Vueltas de un login, del correo o de una pasarela de pago: no son
    // un canal de captación y no deben borrar el anuncio que lo trajo.
    if (/^(accounts|mail)\.google\.|supabase\.co$|(^|\.)(outlook|live|office)\.com$|^(mail|webmail)\.|stripe\.com$/.test(host)) {
      return null;
    }
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

function hayConsentimiento(): boolean {
  return typeof window !== "undefined" && window.growwlyConsent?.publicidad === true;
}

/** Lee los parámetros de la URL actual y, si hay alguno, los guarda. */
export function capturarAtribucion(): void {
  if (!hayConsentimiento()) return;
  const params = new URLSearchParams(window.location.search);
  const datos: Atribucion = {};
  for (const p of PARAMETROS_ATRIBUCION) {
    const v = params.get(p);
    if (v) datos[p] = v.slice(0, 200);
  }
  if (Object.keys(datos).length === 0) {
    const referrer = referrerExterno();
    if (!referrer) return;
    datos.referrer = referrer;
  }
  datos.landing = window.location.pathname.slice(0, 200);
  datos.fecha = new Date().toISOString();
  try {
    localStorage.setItem(CLAVE_ATRIBUCION, JSON.stringify(datos));
  } catch {
    // Sin almacenamiento: esta visita se queda sin atribución.
  }
}

/** La atribución guardada, o null si no hay, ha caducado o no hay consentimiento. */
export function leerAtribucion(): Atribucion | null {
  if (!hayConsentimiento()) return null;
  try {
    const crudo = localStorage.getItem(CLAVE_ATRIBUCION);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as Atribucion;
    if (!datos.fecha || Date.now() - new Date(datos.fecha).getTime() > VALIDEZ_MS) {
      localStorage.removeItem(CLAVE_ATRIBUCION);
      return null;
    }
    return datos;
  } catch {
    return null;
  }
}

/**
 * Lado servidor: deja pasar solo las claves conocidas, como texto corto.
 * Nunca confiar en lo que llega del navegador.
 */
export function sanearAtribucion(valor: unknown): Atribucion | null {
  let datos: unknown = valor;
  if (typeof valor === "string") {
    if (!valor || valor.length > 3000) return null;
    try {
      datos = JSON.parse(valor);
    } catch {
      return null;
    }
  }
  if (!datos || typeof datos !== "object") return null;
  const limpio: Atribucion = {};
  const claves = [...PARAMETROS_ATRIBUCION, "referrer", "landing", "fecha"] as const;
  for (const clave of claves) {
    const v = (datos as Record<string, unknown>)[clave];
    if (typeof v === "string" && v) limpio[clave] = v.slice(0, 200);
  }
  return Object.keys(limpio).some((k) => k !== "landing" && k !== "fecha") ? limpio : null;
}

/**
 * Canal resumido de una atribución, para agrupar en informes:
 * google_ads, meta_ads, google_organico, meta_organico, ia,
 * referral:<dominio>, campana:<utm_source> o directo.
 */
export function canalDeAtribucion(a: Atribucion | null): string {
  if (!a) return "directo";
  const fuente = a.utm_source?.toLowerCase() ?? "";
  const medio = a.utm_medium?.toLowerCase() ?? "";
  const esPago = /cpc|ppc|paid|ads|cpm/.test(medio);
  const esMeta = /facebook|instagram|^fb$|^ig$|meta/.test(fuente);

  if (a.gclid || a.gbraid || a.wbraid || (fuente === "google" && esPago)) return "google_ads";
  if (esMeta && esPago) return "meta_ads";
  if (a.fbclid) return esPago ? "meta_ads" : "meta_fbclid";
  if (fuente) return esPago ? `pago:${fuente}`.slice(0, 60) : `campana:${fuente}`.slice(0, 60);

  const ref = a.referrer?.toLowerCase() ?? "";
  if (!ref) return "directo";
  if (/(^|\.)google\./.test(ref)) return "google_organico";
  if (/(^|\.)(bing|duckduckgo|yahoo|ecosia)\./.test(ref)) return "buscador_otro";
  if (/instagram\.com|facebook\.com|fb\.com|fb\.me/.test(ref)) return "meta_organico";
  if (/chatgpt\.com|openai\.com|perplexity|claude\.ai|gemini\.google/.test(ref)) return "ia";
  return `referral:${ref.replace(/^www\./, "")}`.slice(0, 60);
}
