import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Huella de la IP de quien hace la petición, para limitar abusos (nº de
 * envíos por hora). Con sal secreta: no se guarda la IP en claro ni se
 * puede revertir con una tabla de IPs. El cron limpieza-datos la borra
 * a los 30 días.
 */
export async function huellaIp(): Promise<string | null> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || null;
  if (!ip) return null;
  const sal = process.env.SUPABASE_SECRET_KEY ?? "growwly";
  return createHash("sha256").update(`${sal}:${ip}`).digest("hex");
}
