"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadClinicPhotos } from "@/lib/supabase/storage";

/** Comprueba que el usuario es una clínica aprobada y devuelve su clinic_id. */
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

function isRealFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function actualizarMiFicha(formData: FormData) {
  const clinicId = await requireClinicaAprobada();
  const admin = createAdminClient();

  const str = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? String(value).trim() : null;
  };
  const num = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? Number(value) : null;
  };

  const redesSociales: Record<string, string> = {};
  for (const key of ["instagram", "facebook", "tiktok"]) {
    const value = formData.get(`red_${key}`);
    if (value && String(value).trim() !== "") {
      redesSociales[key] = String(value).trim();
    }
  }

  const servicios = String(formData.get("servicios_adicionales") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const detalleOferta = str("detalle_oferta");

  const camposComunes = {
    descripcion: str("descripcion"),
    telefono: str("telefono"),
    email: str("email"),
    web: str("web"),
    direccion: str("direccion"),
    ciudad: str("ciudad"),
    zona: str("zona"),
    redes_sociales: redesSociales,
    tecnicas: formData.getAll("tecnicas").map(String),
    idiomas: formData.getAll("idiomas").map(String),
    tipo_negocio: str("tipo_negocio"),
    servicios_adicionales: servicios,
    precio_desde: num("precio_desde"),
    precio_hasta: num("precio_hasta"),
    rango_precios: str("rango_precios"),
    horarios: str("horarios"),
    accesibilidad: str("accesibilidad"),
    financiacion: formData.get("financiacion") === "on",
    primera_consulta_gratis: formData.get("primera_consulta_gratis") === "on",
    tiene_oferta: Boolean(detalleOferta),
    detalle_oferta: detalleOferta,
  };

  // El contenido "premium" (antes/después, opiniones, certificados) solo
  // se guarda si de verdad tiene plan premium — comprobado aquí en el
  // servidor, no solo ocultando los campos en el formulario.
  const { data: clinicaActual } = await admin
    .from("clinics")
    .select("plan, fotos_antes_despues, opiniones, certificados")
    .eq("id", clinicId)
    .maybeSingle();

  let camposPremium: Record<string, unknown> = {};

  if (clinicaActual?.plan === "premium") {
    try {
      // Fotos antes/después: hasta 3 pares
      const paresExistentes = Array.isArray(clinicaActual.fotos_antes_despues)
        ? (clinicaActual.fotos_antes_despues as { antes: string; despues: string }[])
        : [];
      const nuevosPares: { antes: string; despues: string }[] = [];
      for (let i = 0; i < 3; i++) {
        const antesFile = formData.get(`antes_${i}`);
        const despuesFile = formData.get(`despues_${i}`);
        const antesUrl = isRealFile(antesFile)
          ? (await uploadClinicPhotos(admin, [antesFile]))[0]
          : paresExistentes[i]?.antes;
        const despuesUrl = isRealFile(despuesFile)
          ? (await uploadClinicPhotos(admin, [despuesFile]))[0]
          : paresExistentes[i]?.despues;
        if (antesUrl && despuesUrl) {
          nuevosPares.push({ antes: antesUrl, despues: despuesUrl });
        }
      }

      // Opiniones: hasta 3
      const opiniones: { autor: string; texto: string }[] = [];
      for (let i = 0; i < 3; i++) {
        const autor = str(`opinion_autor_${i}`);
        const texto = str(`opinion_texto_${i}`);
        if (autor && texto) opiniones.push({ autor, texto });
      }

      // Certificados: se añaden a los que ya hubiera
      const nuevosCertificados = formData.getAll("certificados").filter(isRealFile);
      const certificadosSubidos =
        nuevosCertificados.length > 0
          ? await uploadClinicPhotos(admin, nuevosCertificados)
          : [];
      const certificados = [
        ...(clinicaActual.certificados ?? []),
        ...certificadosSubidos,
      ];

      camposPremium = {
        fotos_antes_despues: nuevosPares,
        opiniones,
        certificados,
      };
    } catch (e) {
      redirect(
        `/clinica/ficha?error=${encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo subir el contenido premium.",
        )}`,
      );
    }
  }

  const { error } = await admin
    .from("clinics")
    .update({ ...camposComunes, ...camposPremium })
    .eq("id", clinicId);

  if (error) {
    redirect(`/clinica/ficha?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/clinica/ficha");
  revalidatePath("/clinicas");
  redirect("/clinica/ficha?guardado=1");
}

export async function cambiarPublicacion(publicar: boolean) {
  const clinicId = await requireClinicaAprobada();

  const supabase = createAdminClient();
  await supabase
    .from("clinics")
    .update({ publicado: publicar })
    .eq("id", clinicId);

  revalidatePath("/clinica/ficha");
  revalidatePath("/clinicas");
  redirect("/clinica/ficha");
}

export async function solicitarDestacado() {
  const clinicId = await requireClinicaAprobada();
  const supabase = createAdminClient();
  await supabase
    .from("clinics")
    .update({ destacado_solicitado: true })
    .eq("id", clinicId);

  revalidatePath("/clinica/ficha");
  redirect("/clinica/ficha?solicitud=destacado");
}

export async function solicitarPremium() {
  const clinicId = await requireClinicaAprobada();
  const supabase = createAdminClient();
  await supabase
    .from("clinics")
    .update({ plan_solicitado: "premium" })
    .eq("id", clinicId);

  revalidatePath("/clinica/ficha");
  redirect("/clinica/ficha?solicitud=premium");
}
