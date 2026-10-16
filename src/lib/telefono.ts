/**
 * Número para wa.me (solo dígitos, con prefijo de país) o null si el
 * teléfono no puede tener WhatsApp.
 *
 * Los números españoles se comprueban por su primera cifra: solo los
 * móviles (6 y 7) tienen WhatsApp; los fijos (8 y 9) no, aunque la
 * casilla "es móvil" de la ficha esté marcada por error. Los de otros
 * países no se pueden comprobar así y se dan por buenos.
 */
export function numeroWhatsApp(telefono: string | null | undefined): string | null {
  if (!telefono) return null;
  let d = telefono.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);

  if (d.length === 9) return /^[67]/.test(d) ? `34${d}` : null;
  if (d.length === 11 && d.startsWith("34")) return /^[67]/.test(d.slice(2)) ? d : null;
  return d.length >= 8 ? d : null;
}
