"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { reenviarAAlternativa } from "@/lib/leads/reenviar-alternativa";

export async function confirmarReenvio(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) redirect("/solicitud-enviada?estado=invalido");

  const resultado = await reenviarAAlternativa(createAdminClient(), token);

  if (resultado.estado === "enviada") {
    redirect(`/solicitud-enviada?clinica=${encodeURIComponent(resultado.clinicaNombre)}`);
  }
  redirect(`/solicitud-enviada?estado=${resultado.estado}`);
}
