"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function iniciarSesionClinica(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/clinica/login?error=${encodeURIComponent("Email o contraseña incorrectos.")}`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role === "patient") {
    await supabase.auth.signOut();
    redirect(
      `/cuenta/login?error=${encodeURIComponent(
        "Esta cuenta es de paciente. Inicia sesión aquí.",
      )}`,
    );
  }

  if (profile?.role === "admin") {
    await supabase.auth.signOut();
    redirect(
      `/admin/login?error=${encodeURIComponent(
        "Esta cuenta es de administrador. Inicia sesión aquí.",
      )}`,
    );
  }

  if (profile?.role !== "clinic") {
    await supabase.auth.signOut();
    redirect(
      `/clinica/login?error=${encodeURIComponent(
        "Esta cuenta no tiene acceso de clínica.",
      )}`,
    );
  }

  redirect("/clinica");
}
