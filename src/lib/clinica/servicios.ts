/**
 * "Otros servicios" de un centro: lista libre, uno por línea, en el
 * lenguaje del paciente ("Injerto sin rasurado completo", "Reparación de
 * cicatrices"…). Complementa a las técnicas (lista cerrada y filtrable):
 * aquí va lo específico de cada centro, que además es contenido long-tail.
 *
 * Acepta también el formato antiguo separado por comas si no hay saltos
 * de línea. Máx. 20 servicios de 120 caracteres.
 */
export function parsearServicios(valor: FormDataEntryValue | null): string[] {
  const bruto = String(valor ?? "").trim();
  if (!bruto) return [];
  const partes = bruto.includes("\n") ? bruto.split(/\r?\n/) : bruto.split(",");
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const p of partes) {
    const s = p.replace(/^[\s•\-–*·]+/, "").trim().slice(0, 120);
    const clave = s.toLowerCase();
    if (s && !vistos.has(clave)) {
      vistos.add(clave);
      out.push(s.charAt(0).toUpperCase() + s.slice(1));
    }
  }
  return out.slice(0, 20);
}
