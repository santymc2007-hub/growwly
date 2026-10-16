import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Enlaces de baja de los emails (recordatorios o marketing) que
 * funcionan sin iniciar sesión, como exige la LSSI ("procedimiento
 * sencillo y gratuito"). El enlace lleva el id del usuario firmado con
 * una clave del servidor, así nadie puede dar de baja a otra persona
 * cambiando el id. Abre una página de confirmación (no da de baja al
 * abrirlo, para que los antivirus de correo que visitan enlaces no
 * den de baja a nadie sin querer).
 */
export type TipoBaja = "recordatorios" | "marketing";

function clave(): string {
  const secreto = process.env.SUPABASE_SECRET_KEY;
  if (!secreto) throw new Error("Falta SUPABASE_SECRET_KEY para firmar enlaces de baja.");
  return secreto;
}

function firma(userId: string, tipo: TipoBaja): string {
  return createHmac("sha256", clave()).update(`baja:${tipo}:${userId}`).digest("hex").slice(0, 32);
}

export function enlaceBaja(siteUrl: string, userId: string, tipo: TipoBaja): string {
  const params = new URLSearchParams({ u: userId, tipo, t: firma(userId, tipo) });
  return `${siteUrl}/emails/baja?${params.toString()}`;
}

export function verificarBaja(userId: string, tipo: string, t: string): tipo is TipoBaja {
  if (tipo !== "recordatorios" && tipo !== "marketing") return false;
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^[0-9a-f]{32}$/.test(t)) return false;
  const esperada = Buffer.from(firma(userId, tipo));
  const recibida = Buffer.from(t);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

/** Pie común de los emails de recordatorio, con el enlace de baja. */
export function pieRecordatorio(siteUrl: string, userId: string): string {
  const enlace = enlaceBaja(siteUrl, userId, "recordatorios");
  return `<p style="font-size: 12px; color: #66756f; margin-top: 24px;">
        Te escribimos porque tienes una cuenta en Growwly. Si no quieres más recordatorios,
        <a href="${enlace}" style="color: #66756f;">date de baja aquí</a> o cámbialo en Mi cuenta.
        Los avisos sobre tus solicitudes (propuestas y citas) te seguirán llegando.
      </p>`;
}
