/**
 * Serializa un objeto para meterlo en <script type="application/ld+json">.
 *
 * JSON.stringify no escapa "<", así que un texto con "</script>" (p. ej.
 * en la descripción que escribe una clínica) cerraría la etiqueta y
 * permitiría inyectar código en la página. Escapar < > & como \u00XX
 * deja el JSON idéntico para Google y sin esa vía (auditoría de
 * seguridad, oct 2026).
 */
export function serializarJsonLd(datos: unknown): string {
  return JSON.stringify(datos)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
