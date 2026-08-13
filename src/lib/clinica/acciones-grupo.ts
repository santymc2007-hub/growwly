"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COOKIE_CLINICA_ACTIVA } from "./contexto-activo";

export async function seleccionarClinicaActiva(formData: FormData) {
  const clinicId = String(formData.get("clinicId") ?? "");
  if (!clinicId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/clinica/login");

  // Comprobar que esa clínica es de verdad una de las suyas antes de
  // cambiar — nunca fiarse de lo que llega del formulario a ciegas.
  const admin = createAdminClient();
  const { data: pertenece } = await admin
    .from("clinic_members")
    .select("id")
    .eq("profile_id", user.id)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (!pertenece) {
    redirect("/clinica");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_CLINICA_ACTIVA, clinicId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  redirect("/clinica");
}
