"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadClinicPhotos, deleteClinicPhotos } from "@/lib/supabase/storage";
import type { Json } from "@/lib/supabase/database.types";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";

function isRealFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function actualizarMiFicha(formData: FormData) {
  const { clinicId } = await requireClinicaActiva();
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

  // Fotos de la clínica: conservar - eliminadas + nuevas, con tope de 5.
  const fotosActuales: string[] = (() => {
    try {
      return JSON.parse(String(formData.get("fotos_actuales") ?? "[]"));
    } catch {
      return [];
    }
  })();
  const fotosAEliminar = formData.getAll("fotos_eliminar").map(String);
  const fotosConservadas = fotosActuales.filter((url) => !fotosAEliminar.includes(url));

  let fotosNuevas: string[] = [];
  try {
    const archivosNuevos = formData.getAll("fotos_nuevas").filter(isRealFile);
    const hueco = Math.max(0, 5 - fotosConservadas.length);
    fotosNuevas = await uploadClinicPhotos(admin, archivosNuevos.slice(0, hueco));
  } catch (e) {
    redirect(
      `/clinica?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudieron subir las fotos.",
      )}`,
    );
  }
  if (fotosAEliminar.length > 0) {
    await deleteClinicPhotos(admin, fotosAEliminar);
  }
  const fotos = [...fotosConservadas, ...fotosNuevas].slice(0, 5);

  let horariosEstructurados: Json = [];
  try {
    horariosEstructurados = JSON.parse(
      String(formData.get("horarios_estructurados") ?? "[]"),
    );
  } catch {
    horariosEstructurados = [];
  }

  const camposComunes = {
    descripcion: str("descripcion"),
    telefono: str("telefono"),
    email: str("email"),
    web: str("web"),
    direccion: str("direccion"),
    ciudad: str("ciudad"),
    provincia: str("provincia") ?? "Illes Balears",
    zona: str("zona"),
    redes_sociales: redesSociales,
    tecnicas: formData.getAll("tecnicas").map(String),
    idiomas: formData.getAll("idiomas").map(String),
    tipo_negocio: str("tipo_negocio"),
    servicios_adicionales: servicios,
    precio_desde: num("precio_desde"),
    precio_hasta: num("precio_hasta"),
    rango_precios: str("rango_precios"),
    horarios_estructurados: horariosEstructurados,
    accesibilidad: str("accesibilidad"),
    financiacion: formData.get("financiacion") === "on",
    primera_consulta_gratis: formData.get("primera_consulta_gratis") === "on",
  };

  // El contenido "premium" (antes/después, opiniones, certificados) se
  // guarda para CUALQUIER plan — así una clínica Básica puede dejarlo
  // listo de antemano. El filtro real (que solo se vea en público si
  // es Premium) vive en la página pública de la ficha, no aquí.
  const { data: clinicaActual } = await admin
    .from("clinics")
    .select("fotos_antes_despues, opiniones, certificados")
    .eq("id", clinicId)
    .maybeSingle();

  let camposPremium: Record<string, unknown> = {};

  try {
    // Fotos antes/después: hasta 3 pares
    const paresExistentes = Array.isArray(clinicaActual?.fotos_antes_despues)
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
      ...(clinicaActual?.certificados ?? []),
      ...certificadosSubidos,
    ];

    // Equipo médico: hasta 3
    const medicos: { nombre: string; especialidad: string }[] = [];
    for (let i = 0; i < 3; i++) {
      const nombreMedico = str(`medico_nombre_${i}`);
      const especialidad = str(`medico_especialidad_${i}`);
      if (nombreMedico) medicos.push({ nombre: nombreMedico, especialidad: especialidad ?? "" });
    }

    camposPremium = {
      tiene_oferta: Boolean(detalleOferta),
      detalle_oferta: detalleOferta,
      descripcion_extendida: str("descripcion_extendida"),
      video_url: str("video_url"),
      medicos,
      fotos_antes_despues: nuevosPares,
      opiniones,
      certificados,
    };
  } catch (e) {
    redirect(
      `/clinica?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudo subir el contenido premium.",
      )}`,
    );
  }

  const logoFile = formData.get("logo");
  let logoUrl: string | undefined;
  if (isRealFile(logoFile)) {
    try {
      [logoUrl] = await uploadClinicPhotos(admin, [logoFile]);
    } catch (e) {
      redirect(
        `/clinica?error=${encodeURIComponent(
          e instanceof Error ? e.message : "No se pudo subir el logo.",
        )}`,
      );
    }
  }

  const { error } = await admin
    .from("clinics")
    .update({
      ...camposComunes,
      ...camposPremium,
      fotos,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", clinicId);

  if (error) {
    redirect(`/clinica?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/clinica");
  revalidatePath("/clinicas");
  redirect("/clinica?guardado=1");
}

export async function cambiarPublicacion(publicar: boolean) {
  const { clinicId } = await requireClinicaActiva();

  const supabase = createAdminClient();
  await supabase
    .from("clinics")
    .update({ publicado: publicar })
    .eq("id", clinicId);

  revalidatePath("/clinica");
  revalidatePath("/clinicas");
  redirect("/clinica");
}
