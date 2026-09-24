"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { vincularClinica } from "@/lib/clinica/vincular-clinica";

export async function registrarClinica(formData: FormData) {
  const modo = String(formData.get("modo") ?? "existente");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const nombreGestor = String(formData.get("nombre_gestor") ?? "").trim();

  if (!email || !password || !nombreGestor) {
    redirect(
      `/clinica/registro?modo=${modo}&error=${encodeURIComponent(
        "Tu nombre, email y contraseña son obligatorios.",
      )}`,
    );
  }

  if (password !== password2) {
    redirect(
      `/clinica/registro?modo=${modo}&error=${encodeURIComponent("Las contraseñas no coinciden.")}`,
    );
  }

  let clinicId: string;
  let esNueva = false;

  if (modo === "nueva") {
    const nombreClinica = String(formData.get("nombre_clinica") ?? "").trim();
    if (!nombreClinica) {
      redirect(
        `/clinica/registro?modo=nueva&error=${encodeURIComponent(
          "Escribe el nombre de tu clínica.",
        )}`,
      );
    }

    const clinicId_ = await crearClinicaNueva(nombreClinica);
    if (!clinicId_) {
      redirect(
        `/clinica/registro?modo=nueva&error=${encodeURIComponent(
          "Ya existe una clínica con ese nombre. Escríbenos si crees que es un error.",
        )}`,
      );
    }
    clinicId = clinicId_;
    esNueva = true;
  } else {
    clinicId = String(formData.get("clinic_id") ?? "").trim();
    if (!clinicId) {
      redirect(
        `/clinica/registro?modo=existente&error=${encodeURIComponent(
          "Selecciona tu clínica.",
        )}`,
      );
    }
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const next = `/clinica/vincular/${clinicId}?nombre=${encodeURIComponent(nombreGestor)}${
    esNueva ? "&nueva=1" : ""
  }`;

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
    redirect(
      `/clinica/registro?modo=${modo}&error=${encodeURIComponent(error.message)}`,
    );
  }

  if (!data.session) {
    redirect("/cuenta/registro/revisa-tu-email");
  }

  if (data.user) {
    await vincularClinica(data.user.id, clinicId, nombreGestor, {
      autoAprobar: esNueva,
    });
  }

  redirect("/clinica");
}

/**
 * Crea la fila de la clínica nueva, sin visibilidad pública
 * (publicado/verificado_admin en false) hasta que admin confirme que
 * quien la ha creado es de verdad su propietario. El resto de datos
 * (ubicación, fotos, contacto...) se rellenan después desde
 * /clinica/ficha — aquí solo hace falta el nombre para poder crear la
 * cuenta y dar acceso al panel.
 *
 * Si el slug ya existe (nombre repetido), reintenta una vez con un
 * sufijo aleatorio antes de rendirse.
 */
async function crearClinicaNueva(nombre: string): Promise<string | null> {
  const admin = createAdminClient();
  const slugBase = slugify(nombre);

  for (const slug of [slugBase, `${slugBase}-${Math.random().toString(36).slice(2, 6)}`]) {
    const { data, error } = await admin
      .from("clinics")
      .insert({
        nombre,
        slug,
        publicado: false,
        verificado_admin: false,
      })
      .select("id")
      .single();

    if (!error && data) return data.id;
  }

  return null;
}
