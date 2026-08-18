/**
 * Lista blanca estricta para el titular WYSIWYG: solo negrita y el
 * resaltado de marca (siempre en amarillo, nunca un color libre).
 * Cualquier otra etiqueta o atributo se descarta.
 */
export function sanitizeTitularHtml(html: string): string {
  return html.replace(/<\/?([a-zA-Z0-9]+)[^>]*>/g, (match, tagNameRaw) => {
    const tag = String(tagNameRaw).toLowerCase();
    const esCierre = match.startsWith("</");

    if (tag === "b" || tag === "strong") return esCierre ? "</b>" : "<b>";
    if (tag === "br") return "<br>";
    if (tag === "span") return esCierre ? "</span>" : '<span class="hl">';

    return "";
  });
}
