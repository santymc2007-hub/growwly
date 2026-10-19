/**
 * Utilidades de la descripción de un centro sin dependencias (se pueden
 * usar también en componentes de cliente). Ver descripcion.ts.
 */

export function esDescripcionHtml(texto: string): boolean {
  return /<(p|strong|br|b)\b[^>]*>/i.test(texto);
}

/** Texto plano, para meta description, schema.org y similares. */
export function descripcionTextoPlano(texto: string | null | undefined): string {
  if (!texto) return "";
  if (!esDescripcionHtml(texto)) return texto.replace(/\s+/g, " ").trim();
  return texto
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
