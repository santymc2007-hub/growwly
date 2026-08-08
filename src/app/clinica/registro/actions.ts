"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { vincularClinica } from "@/lib/clinica/vincular-clinica";

export async function registrarClinica(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const clinicId = String(formData.get("clinic_id") ?? "").trim();

  if (!email || !password || !clinicId) {
    redirect(
      `/clinica/registro?error=${encodeURIComponent(
        "Email, contraseña y clínica son obligatorios.",
      )}`,
    );
  }

  if (password !== password2) {
    redirect(
      `/clinica/registro?error=${encodeURIComponent("Las contraseñas no coinciden.")}`,
    );
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const next = `/clinica/vincular/${clinicId}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "clinic" },
      ...(siteUrl && {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      }),
    },
  });

  if (error) {
    redirect(`/clinica/registro?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect("/cuenta/registro/revisa-tu-email");
  }

  if (data.user) {
    await vincularClinica(data.user.id, clinicId);
  }

  redirect("/clinica");
}
