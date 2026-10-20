
/**
 * Enlazado interno automático — parte pura (sin base de datos, se puede
 * importar desde componentes cliente) (auditoría SEO oct 2026).
 *
 * Detecta en un texto (descripción de centro, post del blog, guía de
 * tratamiento) las menciones a tratamientos y ciudades que tienen página
 * propia en Growwly, y las convierte en enlaces internos. Reglas:
 *  - solo la PRIMERA aparición de cada destino se enlaza;
 *  - como mucho `max` enlaces por texto (por defecto 4);
 *  - nunca dentro de un <a>, un título (h1-h3) o un bloque de código;
 *  - nunca un enlace a la propia página (`excluirHref`).
 */

export type DestinoEnlace = {
  href: string;
  nombre: string;
  /** Formas en las que puede aparecer escrito en un texto. */
  terminos: string[];
  /** Solo en destinos de tratamiento: valor de clinics.tecnicas. */
  tecnica?: string;
  tipo: "tratamiento" | "ciudad";
};

// --- Búsqueda de términos ---------------------------------------------

const VOCALES: Record<string, string> = {
  a: "[aáàä]",
  e: "[eéèë]",
  i: "[iíìï]",
  o: "[oóòö]",
  u: "[uúùü]",
  n: "[nñ]",
};

function sinTildes(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Regex que encuentra el término como palabra completa, sin importar
 * mayúsculas ni tildes. EXCEPTO las siglas (FUE, DHI, PRP…): esas solo
 * en mayúsculas, porque "fue" es también un verbo muy común.
 */
function regexTermino(termino: string, exacto = false): RegExp {
  const esSigla = exacto || /^[A-ZÁÉÍÓÚÑ]{2,6}$/.test(termino.trim());
  const cuerpo = sinTildes(termino.trim())
    .split("")
    .map((ch) => {
      const lower = ch.toLowerCase();
      if (VOCALES[lower]) return VOCALES[lower];
      if (/\s/.test(ch)) return "\\s+";
      return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  const flags = esSigla ? "u" : "iu";
  const final = esSigla ? termino.trim() : cuerpo;
  return new RegExp(`(?<![\\p{L}\\p{N}])${final}(?![\\p{L}\\p{N}])`, flags);
}

const cacheRegex = new Map<string, RegExp>();
/** `exacto`: respeta mayúsculas (ciudades: "Palma", no "palma de la mano"). */
function regexDe(termino: string, exacto = false): RegExp {
  const clave = `${exacto ? "1" : "0"}${termino}`;
  let r = cacheRegex.get(clave);
  if (!r) {
    r = regexTermino(termino, exacto);
    cacheRegex.set(clave, r);
  }
  return r;
}

/** Términos ordenados de más largo a más corto: "injerto FUE" antes que "FUE". */
function terminosOrdenados(d: DestinoEnlace): string[] {
  return [...d.terminos].sort((a, b) => b.length - a.length);
}

/** Destinos que aparecen mencionados en un texto (plano o HTML). */
export function destinosMencionados(texto: string, destinos: DestinoEnlace[]): DestinoEnlace[] {
  const plano = texto.replace(/<[^>]+>/g, " ");
  return destinos.filter((d) =>
    d.terminos.some((t) => regexDe(t, d.tipo === "ciudad").test(plano)),
  );
}

// --- Inserción de enlaces en HTML -------------------------------------

const ETIQUETAS_PROHIBIDAS = /^(a|h1|h2|h3|code|pre|script|style)$/i;

function escaparAtributo(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Enlaza la primera aparición de UN término en el HTML, solo en nodos de
 * texto fuera de etiquetas prohibidas. Devuelve null si no lo encuentra.
 */
function enlazarPrimera(
  html: string,
  termino: string,
  href: string,
  exacto: boolean,
): string | null {
  const trozos = html.split(/(<[^>]+>)/);
  const pila: string[] = [];
  const regex = regexDe(termino, exacto);

  for (let i = 0; i < trozos.length; i++) {
    const t = trozos[i];
    if (t.startsWith("<")) {
      const m = t.match(/^<\s*(\/)?\s*([a-z0-9]+)/i);
      if (m) {
        const nombre = m[2].toLowerCase();
        if (ETIQUETAS_PROHIBIDAS.test(nombre)) {
          if (m[1]) {
            const idx = pila.lastIndexOf(nombre);
            if (idx >= 0) pila.splice(idx, 1);
          } else if (!t.endsWith("/>")) {
            pila.push(nombre);
          }
        }
      }
      continue;
    }
    if (pila.length > 0 || !t) continue;
    const m = t.match(regex);
    if (!m || m.index === undefined) continue;
    trozos[i] =
      t.slice(0, m.index) +
      `<a href="${escaparAtributo(href)}" data-autoenlace="1">${m[0]}</a>` +
      t.slice(m.index + m[0].length);
    return trozos.join("");
  }
  return null;
}

export function autoenlazarHtml(
  html: string,
  destinos: DestinoEnlace[],
  opciones: { max?: number; excluirHref?: string } = {},
): string {
  const max = opciones.max ?? 4;
  let resultado = html;
  let puestos = 0;

  // Los enlaces que ya puso el autor a mano cuentan: no se duplican.
  const yaEnlazados = new Set(
    [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/\/$/, "")),
  );

  for (const d of destinos) {
    if (puestos >= max) break;
    if (d.href === opciones.excluirHref || yaEnlazados.has(d.href)) continue;
    for (const termino of terminosOrdenados(d)) {
      const nuevo = enlazarPrimera(resultado, termino, d.href, d.tipo === "ciudad");
      if (nuevo) {
        resultado = nuevo;
        puestos++;
        break;
      }
    }
  }
  return resultado;
}

/** Texto plano (descripciones antiguas) → HTML con párrafos, escapado. */
export function textoPlanoAHtml(texto: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return texto
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
