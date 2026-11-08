import sanitizeHtml from "sanitize-html";

/**
 * Sanea un SVG subido por una clínica (logos, iconos) antes de guardarlo.
 *
 * Un SVG es XML que puede llevar <script>, manejadores onload/onclick,
 * <foreignObject> con HTML dentro, enlaces javascript: o recursos
 * externos. Aquí se hace lista blanca: solo pasan las etiquetas y
 * atributos de dibujo habituales (formas, degradados, texto, estilos).
 * Todo lo demás se elimina — el logo sigue viéndose igual, pero ya no
 * puede ejecutar nada.
 *
 * Referencias a otros elementos solo con "#id" (degradados, máscaras,
 * <use>); nunca a URLs externas ni a data:.
 */

const ETIQUETAS = [
  "svg", "g", "defs", "title", "desc", "path", "rect", "circle", "ellipse",
  "line", "polyline", "polygon", "text", "tspan", "linearGradient",
  "radialGradient", "stop", "clipPath", "mask", "pattern", "symbol", "use",
  "style",
];

const ATRIBUTOS = [
  "xmlns", "xmlns:xlink", "version", "viewBox", "preserveAspectRatio",
  "width", "height", "x", "y", "cx", "cy", "r", "rx", "ry", "x1", "y1", "x2",
  "y2", "dx", "dy", "d", "points", "transform", "id", "class", "style",
  "fill", "fill-opacity", "fill-rule", "clip-rule", "stroke", "stroke-width",
  "stroke-opacity", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit",
  "stroke-dasharray", "stroke-dashoffset", "opacity", "display", "visibility",
  "offset", "stop-color", "stop-opacity", "gradientUnits", "gradientTransform",
  "spreadMethod", "fx", "fy", "clip-path", "mask", "clipPathUnits",
  "maskUnits", "maskContentUnits", "patternUnits", "patternContentUnits",
  "patternTransform", "font-family", "font-size", "font-weight", "font-style",
  "text-anchor", "letter-spacing", "href", "xlink:href",
];

// Valores de CSS/atributo que NO se admiten: expresiones, javascript:,
// @import y cualquier url(...) que no apunte a un "#id" interno.
const VALOR_SEGURO =
  /^(?![\s\S]*\\)(?![\s\S]*(?:expression|javascript:|vbscript:|@import|behavior|-moz-binding|data:))(?![\s\S]*url\((?!\s*['"]?#))[\s\S]*$/i;

const PROPIEDADES_ESTILO = [
  "fill", "fill-opacity", "fill-rule", "clip-rule", "stroke", "stroke-width",
  "stroke-opacity", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit",
  "stroke-dasharray", "stroke-dashoffset", "opacity", "display", "visibility",
  "stop-color", "stop-opacity", "font-family", "font-size", "font-weight",
  "font-style", "text-anchor", "letter-spacing", "clip-path", "mask",
  "isolation", "mix-blend-mode",
];

// Contenido de una hoja <style>: además de lo anterior, sin "<" (nada de
// etiquetas ni CDATA dentro), sin "\" (escapes de CSS que ocultan "url(") y
// sin funciones que cargan recursos.
const CSS_SEGURO =
  /^(?![\s\S]*[<\\])(?![\s\S]*\b(?:image-set|src|element|paint|cross-fade)\s*\()(?![\s\S]*(?:expression|javascript:|vbscript:|@import|behavior|-moz-binding|data:))(?![\s\S]*url\((?!\s*['"]?#))[\s\S]*$/i;

const BLOQUE_STYLE = /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/g;

const allowedStyles: Record<string, RegExp[]> = {};
for (const p of PROPIEDADES_ESTILO) allowedStyles[p] = [VALOR_SEGURO];

/** href / xlink:href solo a un "#id" del propio SVG. */
const HREF_INTERNO = /^#[\w.:-]+$/;

export type ResultadoSvg =
  | { ok: true; svg: string }
  | { ok: false; motivo: string };

export function sanearSvg(origen: string): ResultadoSvg {
  if (!/<svg[\s>]/i.test(origen)) {
    return { ok: false, motivo: "El archivo no parece un SVG válido." };
  }

  // sanitize-html copia en bruto el texto de <style>, así que las hojas de
  // estilo dudosas se vacían ANTES de sanear (el logo pierde ese estilo,
  // pero no puede cargar nada externo).
  const previo = origen.replace(BLOQUE_STYLE, (_m, abre: string, css: string, cierra: string) =>
    CSS_SEGURO.test(css) ? abre + css + cierra : abre + cierra,
  );

  const limpio = sanitizeHtml(previo, {
    allowedTags: ETIQUETAS,
    allowVulnerableTags: true, // <style> se controla arriba, bloque a bloque
    allowedAttributes: { "*": ATRIBUTOS },
    allowedStyles: { "*": allowedStyles },
    allowedSchemes: [],
    allowProtocolRelative: false,
    // Conserva mayúsculas (viewBox, linearGradient, clipPath…).
    parser: { xmlMode: true, lowerCaseTags: false, lowerCaseAttributeNames: false },
    // Si se descarta una etiqueta (script, foreignObject…), también su contenido.
    disallowedTagsMode: "discard",
    nonTextTags: ["script", "foreignObject", "iframe", "object", "embed", "noscript"],
    transformTags: {
      "*": (nombre, atributos) => {
        const a = { ...atributos };
        for (const clave of ["href", "xlink:href"]) {
          if (clave in a && !HREF_INTERNO.test(a[clave].trim())) delete a[clave];
        }
        return { tagName: nombre, attribs: a };
      },
    },
  });

  if (!/<svg[\s>]/i.test(limpio)) {
    return { ok: false, motivo: "El SVG no tiene contenido válido tras la limpieza." };
  }
  // Red de seguridad: si aun así queda algo ejecutable, se rechaza el archivo.
  if (/<\s*(?:script|foreignObject|iframe|object|embed)|<[^>]*\son\w+\s*=|javascript:/i.test(limpio)) {
    return { ok: false, motivo: "El SVG contiene elementos no permitidos." };
  }
  return { ok: true, svg: limpio };
}
