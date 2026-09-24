"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarEventoLead } from "@/lib/leads/lead-events";

/**
 * Desbloquea un lead para que la clínica vea el perfil completo del
 * paciente. De momento es un desbloqueo directo (sin pasarela de pago
 * integrada) — Santy factura estos desbloqueos a mano por ahora. El
 * mismo campo "estado" que usaría un pago real ya queda preparado para
 * cuando se conecte Stripe más adelante: solo cambiará qué dispara
 * este mismo cambio de estado, no la estructura de datos.
 */
export async function desbloquearLead(token: string) {
  const supabase = createAdminClient();

  const { data: lead } = await supabase
    .from("leads_clinica")
    .update({ estado: "desbloqueado", desbloqueado_en: new Date().toISOString() })
    .eq("token", token)
    .select("id, solicitud_id, clinic_id")
    .maybeSingle();

  if (lead) {
    await registrarEventoLead(supabase, {
      event: "lead_unlocked",
      solicitudId: lead.solicitud_id,
      leadId: lead.id,
      clinicId: lead.clinic_id,
    });
  }

  revalidatePath(`/leads/${token}`);
}
