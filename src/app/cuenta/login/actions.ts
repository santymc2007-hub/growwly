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

  if (claim && data.user) {
    const estudioId = await reclamarEstudio(data.user.id, claim);
    if (estudioId) {
      redirect(`/cuenta/analisis/${estudioId}`);
    }
  }

  redirect("/cuenta");
}
