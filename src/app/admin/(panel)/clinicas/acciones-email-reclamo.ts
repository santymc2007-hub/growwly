"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";
import { prepararEmailReclamo } from "@/lib/admin/email-reclamo";

export type ResultadoEnvioReclamo = { ok: true; enviadoEn: string } | { ok: false; error: string };

/**
 * Envía a UN centro el email "reclama tu ficha". Solo desde el admin,
 * uno a uno y con confirmación en pantalla. No se envía a centros sin
 * email, con cuenta o dados de baja. Reenviar es posible, pero el
 * botón lo pide de forma explícita.
 */
export async function enviarEmailReclamo(clinicId: string): Promise<ResultadoEnvioReclamo> {
  await requireAdmin();
  const admin = createAdminClient();

  const preparado = await prepararEmailReclamo(admin, clinicId);
  if ("error" in preparado) return { ok: false, error: preparado.error ?? "Error desconocido." };

  const { clinic, estado, asunto, html } = preparado;
  if (estado === "sin-email") return { ok: false, error: "Este centro no tiene email." };
  if (estado === "con-cuenta") return { ok: false, error: "Este centro ya tiene cuenta: no hace falta." };
  if (estado === "baja") return { ok: false, error: "Este centro pidió no recibir más emails." };

  try {
    await enviarEmail({ to: clinic.email!, subject: asunto, html, replyTo: "hola@growwly.es" });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se ha podido enviar." };
  }

  const ahora = new Date().toISOString();
  const { data: previo } = await admin
    .from("clinic_avisos_reclamo")
    .select("veces")
    .eq("clinic_id", clinicId)
    .maybeSingle();
  await admin.from("clinic_avisos_reclamo").upsert(
    {
      clinic_id: clinicId,
      enviado_en: ahora,
      enviado_a: clinic.email,
      veces: (previo?.veces ?? 0) + 1,
    },
    { onConflict: "clinic_id" },
  );

  revalidatePath("/admin/clinicas");
  return { ok: true, enviadoEn: ahora };
}
