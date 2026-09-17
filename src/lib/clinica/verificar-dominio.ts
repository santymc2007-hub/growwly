/**
 * Señal (no un bloqueo) para que el admin decida con más criterio al
 * aprobar una cuenta de clínica: si el dominio del email coincide con
 * el de la web registrada, es una buena pista de que quien se
 * registra es de verdad el dueño. No coincidir no es automáticamente
 * sospechoso — muchas clínicas pequeñas usan Gmail para todo — pero sí
 * merece revisarlo con más cuidado.
 */
export type VerificacionDominio = "coincide" | "no_coincide" | "sin_web";

function dominioDe(url: string): string | null {
  try {
    const conProtocolo = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(conProtocolo).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function verificarDominio(
  email: string | null,
  web: string | null,
): VerificacionDominio {
  const dominioWeb = web ? dominioDe(web) : null;
  if (!dominioWeb) return "sin_web";

  const dominioEmail = email?.split("@")[1]?.toLowerCase().trim() ?? "";
  return dominioEmail === dominioWeb ? "coincide" : "no_coincide";
}
