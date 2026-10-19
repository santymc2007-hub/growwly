import sanitizeHtml from "sanitize-html";
import { esDescripcionHtml, descripcionTextoPlano } from "./descripcion-texto";

export { esDescripcionHtml, descripcionTextoPlano };

/**
 * Descripción de la ficha de un centro.
 *
 * Desde oct 2026 se edita con un editor sencillo (negrita y párrafos) que
 * guarda HTML mínimo: <p>, <strong> y <br>. Las descripciones antiguas
 * son texto plano y siguen funcionando tal cual. Google (meta
 * description, datos estructurados) siempre recibe texto plano.
 */

const OPCIONES: sanitizeHtml.IOptions = {
  allowedTags: ["p", "strong", "br"],
  allowedAttributes: {},
  transformTags: { b: "strong", div: "p" },
};

/** Limpia lo que llega del formulario antes de guardarlo. Vacío → null. */
export function limpiarDescripcion(valor: FormDataEntryValue | null): string | null {
  const bruto = String(valor ?? "").trim();
  if (!bruto) return null;
  const limpio = esDescripcionHtml(bruto)
    ? sanitizeHtml(bruto, OPCIONES)
        .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "")
        .trim()
    : bruto;
  return descripcionTextoPlano(limpio) ? limpio : null;
}

/** Para mostrar en la ficha pública: HTML ya saneado (o null si es texto plano). */
export function descripcionHtmlSegura(texto: string): string | null {
  return esDescripcionHtml(texto) ? sanitizeHtml(texto, OPCIONES) : null;
}
