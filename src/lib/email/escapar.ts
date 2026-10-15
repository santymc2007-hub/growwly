/**
 * Escapa texto para meterlo en el HTML de un email. Lo que escribe un
 * paciente, una clínica o la IA no puede convertirse en etiquetas o
 * enlaces dentro del correo (auditoría de seguridad, oct 2026).
 */
export function esc(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
