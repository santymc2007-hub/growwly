"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function aprobarCuentaClinica(profileId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("profiles")
    .update({ clinic_status: "aprobado" })
    .eq("id", profileId);

  revalidatePath("/admin/clinicas-cuentas");
}

export async function rechazarCuentaClinica(profileId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("profiles")
    .update({ role: "patient", clinic_id: null, clinic_status: null })
    .eq("id", profileId);

  revalidatePath("/admin/clinicas-cuentas");
}
