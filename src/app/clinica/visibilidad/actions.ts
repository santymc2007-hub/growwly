"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireClinicaAprobada(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/clinica/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, clinic_id, clinic_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.role !== "clinic" ||
    profile.clinic_status !== "aprobado" ||
    !profile.clinic_id
  ) {
    redirect("/clinica");
  }

  return profile.clinic_id;
}

export async function solicitarDestacadoListado() {
  const clinicId = await requireClinicaAprobada();
  const supabase = createAdminClient();
  await supabase
    .from("clinics")
    .update({ destacado_solicitado: true })
    .eq("id", clinicId);
  revalidatePath("/clinica/visibilidad");
  redirect("/clinica/visibilidad?solicitud=1");
}

export async function solicitarDestacadoHome() {
  const clinicId = await requireClinicaAprobada();
  const supabase = createAdminClient();
  await supabase
    .from("clinics")
    .update({ destacado_home_solicitado: true })
    .eq("id", clinicId);
  revalidatePath("/clinica/visibilidad");
  redirect("/clinica/visibilidad?solicitud=1");
}

export async function solicitarDestacadoCiudad() {
  const clinicId = await requireClinicaAprobada();
  const supabase = createAdminClient();
  await supabase
    .from("clinics")
    .update({ destacado_ciudad_solicitado: true })
    .eq("id", clinicId);
  revalidatePath("/clinica/visibilidad");
  redirect("/clinica/visibilidad?solicitud=1");
}

export async function solicitarPremium() {
  const clinicId = await requireClinicaAprobada();
  const supabase = createAdminClient();
  await supabase
    .from("clinics")
    .update({ plan_solicitado: "premium" })
    .eq("id", clinicId);
  revalidatePath("/clinica/visibilidad");
  redirect("/clinica/visibilidad?solicitud=1");
}
