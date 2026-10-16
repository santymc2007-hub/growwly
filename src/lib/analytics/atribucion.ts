/**
 * Atribución de leads: de qué anuncio o campaña viene cada solicitud.
 *
 * Al llegar a la web con parámetros de campaña (gclid, fbclid, utm_…)
 * se guardan en el navegador y se mandan junto con la solicitud, para
 * poder ver en la base de datos qué campañas traen leads que de verdad
 * acaban en un centro. Solo con consentimiento de publicidad: sin él no
 * se guarda ni se envía nada.
 *
 * Modelo "último clic": una visita nueva con parámetros sustituye a la
 * anterior. Caduca a los 90 días, como las cookies de los anuncios.
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
  landing?: string;
  fecha?: string;
};

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
  if (Object.keys(datos).length === 0) return;
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
  const claves = [...PARAMETROS_ATRIBUCION, "landing", "fecha"] as const;
  for (const clave of claves) {
    const v = (datos as Record<string, unknown>)[clave];
    if (typeof v === "string" && v) limpio[clave] = v.slice(0, 200);
  }
  return Object.keys(limpio).some((k) => k !== "landing" && k !== "fecha") ? limpio : null;
}
