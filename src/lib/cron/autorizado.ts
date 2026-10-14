/**
 * Comprueba que la llamada a un cron viene de Vercel Cron, que manda
 * "Authorization: Bearer <CRON_SECRET>".
 *
 * Si CRON_SECRET no está definida se RECHAZA (antes se dejaba pasar,
 * y cualquiera podía disparar los crons, p. ej. mandar recordatorios
 * por email en bucle). Auditoría de seguridad, oct 2026.
 */
export function cronAutorizado(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET no está definida en el entorno: cron rechazado.");
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
