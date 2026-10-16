"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificarBaja } from "@/lib/email/baja";

export async function confirmarBaja(formData: FormData) {
  const u = String(formData.get("u") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const t = String(formData.get("t") ?? "");

  if (!verificarBaja(u, tipo, t)) {
    redirect("/emails/baja?estado=invalido");
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update(
      tipo === "marketing" ? { acepta_marketing_email: false } : { acepta_recordatorios_email: false },
    )
    .eq("id", u);

  redirect(`/emails/baja?estado=hecho&tipo=${tipo}`);
}
