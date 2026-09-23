"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadClinicPhotos, deleteClinicPhotos } from "@/lib/supabase/storage";
import type { Json } from "@/lib/supabase/database.types";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import { slugify } from "@/lib/slugify";

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
  for (const key of ["instagram", "facebook", "tiktok", "linkedin"]) {
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

  // El contenido "premium" (antes/después, opiniones, certificados) se
  // guarda para CUALQUIER plan — así una clínica Básica puede dejarlo
  // listo de antemano. El filtro real (que solo se vea en público si
  // es Premium) vive en la página pública de la ficha, no aquí.
  const { data: clinicaActual } = await admin
    .from("clinics")
    .select("nombre, slug, slugs_antiguos, fotos, fotos_antes_despues, opiniones, certificados")
    .eq("id", clinicId)
    .maybeSingle();

  // Si cambia el nombre, el slug de la URL se actualiza para que siga
  // reflejándolo — pero el slug anterior se guarda en slugs_antiguos:
  // la ficha pública redirige (308, permanente) desde cualquiera de
  // esos slugs viejos a la URL actual, así que un enlace ya compartido
  // o indexado en Google nunca deja de funcionar.
  const nombreNuevo = str("nombre");
  let nuevoSlug: string | undefined;
  let slugsAntiguos: string[] | undefined;
  if (clinicaActual && nombreNuevo && nombreNuevo !== clinicaActual.nombre) {
    const candidato = slugify(nombreNuevo);
    if (candidato && candidato !== clinicaActual.slug) {
      const { data: colision } = await admin
        .from("clinics")
        .select("id")
        .eq("slug", candidato)
        .neq("id", clinicId)
        .maybeSingle();
      nuevoSlug = colision ? `${candidato}-${clinicId.slice(0, 6)}` : candidato;
      slugsAntiguos = Array.from(
        new Set([...(clinicaActual.slugs_antiguos ?? []), clinicaActual.slug]),
      );
    }
  }

  // Fotos de la clínica: el campo fotos_orden (rellenado por
  // FotosClinicaField) describe el orden final exacto — existentes y
  // nuevas intercaladas, tal y como las dejó la clínica arrastrándolas
  // o con los botones ‹ ›. La primera es la que se usa como foto
  // principal en los listados.
  const MAX_FOTOS = 10;
  type OrdenEntrada = { t: "e"; url: string } | { t: "n" };
  const orden: OrdenEntrada[] = (() => {
    try {
      return JSON.parse(String(formData.get("fotos_orden") ?? "[]"));
    } catch {
      return [];
    }
  })();

  let fotos: string[] = [];
  try {
    const archivosNuevos = formData.getAll("fotos_nuevas").filter(isRealFile);
    const nuevasUrls = await uploadClinicPhotos(admin, archivosNuevos);
    let cursorNuevas = 0;
    fotos = orden
      .map((entrada) =>
        entrada.t === "e" ? entrada.url : nuevasUrls[cursorNuevas++],
      )
      .filter((url): url is string => Boolean(url))
      .slice(0, MAX_FOTOS);
  } catch (e) {
    redirect(
      `/clinica?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudieron subir las fotos.",
      )}`,
    );
  }

  const fotosEliminadas = (clinicaActual?.fotos ?? []).filter(
    (url) => !fotos.includes(url),
  );
  if (fotosEliminadas.length > 0) {
    await deleteClinicPhotos(admin, fotosEliminadas);
  }

  let horariosEstructurados: Json = [];
  try {
    horariosEstructurados = JSON.parse(
      String(formData.get("horarios_estructurados") ?? "[]"),
    );
  } catch {
    horariosEstructurados = [];
  }

  const camposComunes = {
    // La ficha exige rellenar el nombre (required en el input), pero
    // por si acaso llega vacío nunca se manda null — nombre es NOT
    // NULL en la base de datos.
    nombre: str("nombre") ?? undefined,
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
    acepta_videoconsulta: formData.get("acepta_videoconsulta") === "on",
  };

  let camposPremium: Record<string, unknown> = {};

  try {
    // Fotos antes/después: hasta 10 pares
    const paresExistentes = Array.isArray(clinicaActual?.fotos_antes_despues)
      ? (clinicaActual.fotos_antes_despues as { antes: string; despues: string }[])
      : [];
    const nuevosPares: { antes: string; despues: string }[] = [];
    for (let i = 0; i < 10; i++) {
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

    // Opiniones: hasta 10. La puntuación (1-5) es la de esa opinión
    // concreta escrita a mano — no tiene relación con rating_google, que
    // es la nota agregada que en el futuro se traerá automáticamente de
    // la ficha de Google Maps de la clínica. Sirve para poder marcar cada
    // opinión con su propio schema.org Review (reviewRating) en la ficha
    // pública.
    const opiniones: { autor: string; texto: string; puntuacion: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const autor = str(`opinion_autor_${i}`);
      const texto = str(`opinion_texto_${i}`);
      const puntuacion = num(`opinion_puntuacion_${i}`) ?? 5;
      if (autor && texto) {
        opiniones.push({ autor, texto, puntuacion: Math.min(5, Math.max(1, puntuacion)) });
      }
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
    const medicos: { nombre: string; especialidad: string; linkedin?: string }[] = [];
    for (let i = 0; i < 3; i++) {
      const nombreMedico = str(`medico_nombre_${i}`);
      const especialidad = str(`medico_especialidad_${i}`);
      const linkedin = str(`medico_linkedin_${i}`);
      if (nombreMedico) {
        medicos.push({
          nombre: nombreMedico,
          especialidad: especialidad ?? "",
          ...(linkedin ? { linkedin } : {}),
        });
      }
    }

    camposPremium = {
      tiene_oferta: Boolean(detalleOferta),
      detalle_oferta: detalleOferta,
      descripcion_extendida: str("descripcion_extendida"),
      video_url: str("video_url"),
      reserva_online_url: str("reserva_online_url"),
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
      ...(nuevoSlug ? { slug: nuevoSlug, slugs_antiguos: slugsAntiguos } : {}),
    })
    .eq("id", clinicId);

  if (error) {
    redirect(`/clinica?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/clinica");
  revalidatePath("/clinica/solicitudes");
  revalidatePath("/clinica/visibilidad");
  revalidatePath("/clinica/facturacion");
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
