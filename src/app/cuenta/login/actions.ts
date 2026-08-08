"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reclamarEstudio } from "@/lib/estudios/reclamar-estudio";

export async function iniciarSesionPaciente(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const claim = String(formData.get("claim") ?? "").trim();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/cuenta/login?error=${encodeURIComponent("Email o contraseña incorrectos.")}${
        claim ? `&claim=${claim}` : ""
      }`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role === "clinic") {
    await supabase.auth.signOut();
    redirect(
      `/clinica/login?error=${encodeURIComponent(
        "Esta cuenta es de clínica. Inicia sesión aquí.",
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

  if (claim && data.user) {
    const estudioId = await reclamarEstudio(data.user.id, claim);
    if (estudioId) {
      redirect(`/cuenta/analisis/${estudioId}`);
    }
  }

  redirect("/cuenta");
}
