import type { Metadata } from "next";

/**
 * Reglas SEO de titles y metas (auditoría oct 2026). Todas las páginas
 * públicas montan su title y su description con estas funciones, así
 * ninguna se pasa de largo, se corta a mitad de palabra o hereda la del
 * layout.
 *
 *  - Title: ≤ 60 caracteres CONTANDO el sufijo " | Growwly". Se prueban
 *    varias versiones de más a menos completa y se usa la primera que
 *    cabe. Si ni la más corta cabe con sufijo, va sin sufijo (la marca
 *    pierde menos que la keyword).
 *  - Meta description: entre 120 y 158 caracteres. Se parte de una frase
 *    base y se añaden datos opcionales mientras quepan; el cierre (CTA)
 *    siempre entra. Nunca se corta a mitad de frase salvo último recurso.
 */

export const SUFIJO_TITLE = " | Growwly";
export const MAX_TITLE = 60;
export const MAX_META = 158;
export const MIN_META = 120;

const limpiar = (t: string) => t.replace(/\s+/g, " ").trim();

function cortarEnPalabra(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max - 1);
  return `${corte.slice(0, corte.lastIndexOf(" ")).replace(/[,.;:–—-]$/, "")}…`;
}

/** Primera versión que cabe. Ordena los candidatos de más a menos completo. */
export function tituloSeo(...candidatos: (string | null | undefined | false)[]): Metadata["title"] {
  const lista = candidatos.filter((c): c is string => Boolean(c)).map(limpiar);
  for (const c of lista) if (c.length + SUFIJO_TITLE.length <= MAX_TITLE) return c;
  for (const c of lista) if (c.length <= MAX_TITLE) return { absolute: c };
  return { absolute: cortarEnPalabra(lista[lista.length - 1] ?? "Growwly", MAX_TITLE) };
}

/** Texto final del title tal como saldrá (para og:title). */
export function textoTitle(t: Metadata["title"]): string {
  if (!t) return "Growwly";
  if (typeof t === "string") return `${t}${SUFIJO_TITLE}`;
  if ("absolute" in t && t.absolute) return t.absolute;
  return "Growwly";
}

/**
 * Meta description: `base` + los `extras` que quepan + `cierre`.
 * Cada parte debe ser una frase completa terminada en punto.
 */
export function metaSeo(base: string, extras: (string | null | undefined | false)[] = [], cierre = ""): string {
  const fin = cierre ? ` ${limpiar(cierre)}` : "";
  let texto = limpiar(base);
  if (texto.length + fin.length > MAX_META) return cortarEnPalabra(`${texto}${fin}`, MAX_META);
  for (const e of extras) {
    if (!e) continue;
    const parte = ` ${limpiar(e)}`;
    if (texto.length + parte.length + fin.length <= MAX_META) texto += parte;
  }
  return `${texto}${fin}`;
}

/** Texto plano (Markdown/HTML) → frase para meta, sin marcas. */
export function textoPlano(contenido: string): string {
  return limpiar(
    contenido
      .replace(/<[^>]+>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[#*_>`]/g, ""),
  );
}

/** Primeras frases completas de un texto que quepan en `max`. */
export function primerasFrases(texto: string, max = MAX_META): string {
  const frases = textoPlano(texto).match(/[^.!?]+[.!?]+/g) ?? [textoPlano(texto)];
  let out = "";
  for (const f of frases) {
    const s = limpiar(f);
    if ((out ? `${out} ${s}` : s).length > max) break;
    out = out ? `${out} ${s}` : s;
  }
  return out || cortarEnPalabra(textoPlano(texto), max);
}
