"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { uploadClinicPhotos, deleteClinicPhotos } from "@/lib/supabase/storage";
import type { Database, Json } from "@/lib/supabase/database.types";

// plan/destacado/destacado_home/destacado_ciudad se excluyen a propósito:
// ahora se gestionan en exclusiva desde las acciones de Visibilidad
// (activarVisibilidad/desactivarVisibilidad en ../visibilidad/actions),
// nunca desde este formulario — si se incluyeran aquí, cada guardado de
// cualquier otro campo los resetearía a su valor por defecto.
// rating_google/resenas_google tampoco: los sobrescribe solo el cron
// semanal de Google Places, nunca a mano.
type ClinicWrite = Omit<
  Database["public"]["Tables"]["clinics"]["Insert"],
  | "id"
  | "slug"
  | "created_at"
  | "updated_at"
  | "fotos"
  | "logo_url"
  | "plan"
  | "destacado"
  | "destacado_home"
  | "destacado_ciudad"
  | "rating_google"
  | "resenas_google"
>;

function isRealFile(value: FormDataEntryValue): value is File {
  return value instanceof File && value.size > 0;
}

const MAX_FOTOS = 10;
type OrdenFotoEntrada = { t: "e"; url: string } | { t: "n" };

/**
 * Lee el orden final de fotos (campo fotos_orden, rellenado por
 * FotosClinicaField — ver clinica/ficha/actions.ts, de donde se copia
 * este mismo patrón) y sube las nuevas. La primera del array resultante
 * es la que se usa como foto principal en los listados.
 */
async function leerFotosConOrden(
  supabase: ReturnType<typeof createAdminClient>,
  formData: FormData,
): Promise<string[]> {
  const orden: OrdenFotoEntrada[] = (() => {
    try {
      return JSON.parse(String(formData.get("fotos_orden") ?? "[]"));
    } catch {
      return [];
    }
  })();

  const archivosNuevos = formData.getAll("fotos_nuevas").filter(isRealFile);
  const nuevasUrls = await uploadClinicPhotos(supabase, archivosNuevos);
  let cursorNuevas = 0;
  return orden
    .map((entrada) => (entrada.t === "e" ? entrada.url : nuevasUrls[cursorNuevas++]))
    .filter((url): url is string => Boolean(url))
    .slice(0, MAX_FOTOS);
}

/**
 * Contenido de "Perfil ampliado" que implica subir archivos (fotos
 * antes/después, certificados) — se guarda aunque el plan sea Básico,
 * igual que hace la propia clínica desde su panel (ficha/actions.ts):
 * así puede quedar listo de antemano y activarse sin más tarde desde
 * Visibilidad.
 */
async function leerContenidoPremiumConArchivos(
  supabase: ReturnType<typeof createAdminClient>,
  formData: FormData,
  existente?: {
    fotos_antes_despues: unknown;
    certificados: string[] | null;
  },
) {
  const str = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? String(value).trim() : null;
  };

  const paresExistentes = Array.isArray(existente?.fotos_antes_despues)
    ? (existente.fotos_antes_despues as {
        antes: string;
        despues: string;
        descripcion?: string;
      }[])
    : [];
  const nuevosPares: { antes: string; despues: string; descripcion?: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const antesFile = formData.get(`antes_${i}`);
    const despuesFile = formData.get(`despues_${i}`);
    const descripcion = str(`antes_despues_descripcion_${i}`);
    const antesUrl =
      antesFile && isRealFile(antesFile)
        ? (await uploadClinicPhotos(supabase, [antesFile]))[0]
        : paresExistentes[i]?.antes;
    const despuesUrl =
      despuesFile && isRealFile(despuesFile)
        ? (await uploadClinicPhotos(supabase, [despuesFile]))[0]
        : paresExistentes[i]?.despues;
    if (antesUrl && despuesUrl) {
      nuevosPares.push({
        antes: antesUrl,
        despues: despuesUrl,
        ...(descripcion ? { descripcion } : {}),
      });
    }
  }

  // Certificados: se añaden a los que ya hubiera.
  const nuevosCertificados = formData.getAll("certificados").filter(isRealFile);
  const certificadosSubidos =
    nuevosCertificados.length > 0
      ? await uploadClinicPhotos(supabase, nuevosCertificados)
      : [];
  const certificados = [...(existente?.certificados ?? []), ...certificadosSubidos];

  return { fotos_antes_despues: nuevosPares as Json, certificados };
}

/** redirect() de Next.js funciona lanzando un error especial — hay que
 * dejarlo pasar tal cual y no tratarlo como un fallo inesperado. */
function esErrorDeRedirect(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest?: unknown }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

/**
 * En producción Next.js oculta el mensaje real de cualquier error
 * inesperado al enviarlo al navegador — por eso lo dejamos también en
 * los logs del servidor (Vercel → Logs) con console.error, y añadimos
 * el "digest" al mensaje que sí llega al admin para poder localizar esa
 * entrada del log exacta.
 */
function mensajeConDigest(e: unknown, mensajePorDefecto: string): string {
  console.error(e);
  const digest =
    typeof e === "object" && e !== null && "digest" in e
      ? String((e as { digest?: unknown }).digest)
      : null;
  const base = e instanceof Error ? e.message : mensajePorDefecto;
  return digest ? `${base} (código: ${digest})` : base;
}

/**
 * Normaliza el slug pedido desde el formulario y, si colisiona con el
 * de otra clínica (excluyendo la que se esté editando), le añade un
 * sufijo corto para que siga siendo único — la tabla tiene un unique
 * constraint en esta columna.
 */
async function resolverSlug(
  supabase: ReturnType<typeof createAdminClient>,
  candidato: string,
  excluirId?: string,
): Promise<string> {
  let query = supabase.from("clinics").select("id").eq("slug", candidato);
  if (excluirId) query = query.neq("id", excluirId);
  const { data: colision } = await query.maybeSingle();
  return colision ? `${candidato}-${crypto.randomUUID().slice(0, 6)}` : candidato;
}

async function subirLogoSiLlega(
  supabase: ReturnType<typeof createAdminClient>,
  formData: FormData,
  urlErrorRedirect: string,
): Promise<string | undefined> {
  const logoFile = formData.get("logo");
  if (!logoFile || !isRealFile(logoFile)) return undefined;
  try {
    const [logoUrl] = await uploadClinicPhotos(supabase, [logoFile]);
    return logoUrl;
  } catch (uploadError) {
    const message =
      uploadError instanceof Error ? uploadError.message : "No se pudo subir el logo.";
    redirect(`${urlErrorRedirect}?error=${encodeURIComponent(message)}`);
  }
}

function readClinicFields(formData: FormData): ClinicWrite {
  const num = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? Number(value) : null;
  };
  const str = (key: string) => {
    const value = formData.get(key);
    return value && String(value).trim() !== "" ? String(value).trim() : null;
  };

  const redesSociales: Record<string, string> = {};
  for (const key of ["instagram", "facebook", "tiktok", "linkedin"]) {
    const value = formData.get(`red_${key}`);
    if (value && String(value).trim() !== "") {
      redesSociales[key] = String(value).trim();
    }
  }

  // Equipo médico: hasta 3 — solo texto, sin archivos, puede leerse aquí.
  const medicos: { nombre: string; especialidad: string; linkedin?: string; colegiado?: string }[] = [];
  for (let i = 0; i < 3; i++) {
    const nombreMedico = str(`medico_nombre_${i}`);
    const especialidad = str(`medico_especialidad_${i}`);
    const linkedin = str(`medico_linkedin_${i}`);
    const colegiado = str(`medico_colegiado_${i}`);
    if (nombreMedico) {
      medicos.push({
        nombre: nombreMedico,
        especialidad: especialidad ?? "",
        ...(linkedin ? { linkedin } : {}),
        ...(colegiado ? { colegiado } : {}),
      });
    }
  }

  // Opiniones: hasta 10 — se reemplazan enteras en cada guardado (igual
  // que hace la propia clínica desde su panel), no hace falta mezclar
  // con las existentes.
  const opiniones: { autor: string; texto: string; puntuacion: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const autor = str(`opinion_autor_${i}`);
    const texto = str(`opinion_texto_${i}`);
    const puntuacion = num(`opinion_puntuacion_${i}`) ?? 5;
    if (autor && texto) {
      opiniones.push({ autor, texto, puntuacion: Math.min(5, Math.max(1, puntuacion)) });
    }
  }

  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    descripcion: str("descripcion"),
    comunidad_autonoma: str("comunidad_autonoma"),
    provincia: str("provincia") ?? "Illes Balears",
    ciudad: str("ciudad"),
    zona: str("zona"),
    lat: num("lat"),
    lng: num("lng"),
    telefono: str("telefono"),
    telefono_es_movil: formData.get("telefono_es_movil") === "on",
    email: str("email"),
    web: str("web"),
    registro_sanitario: str("registro_sanitario"),
    redes_sociales: redesSociales,
    tecnicas: formData.getAll("tecnicas").map(String),
    idiomas: formData.getAll("idiomas").map(String),
    financiacion: formData.get("financiacion") === "on",
    primera_consulta_gratis: formData.get("primera_consulta_gratis") === "on",
    verificado: formData.get("verificado") === "on",
    publicado: formData.get("publicado") === "on",
    verificado_admin: formData.get("verificado_admin") === "on",
    leads_enabled: formData.get("leads_enabled") === "on",
    direccion: str("direccion"),
    rango_precios: str("rango_precios"),
    precio_desde: num("precio_desde"),
    precio_hasta: num("precio_hasta"),
    accesibilidad: str("accesibilidad"),
    accesibilidad_checks: formData.getAll("accesibilidad_checks").map(String),
    acepta_videoconsulta: formData.get("acepta_videoconsulta") === "on",
    horarios_estructurados: (() => {
      try {
        return JSON.parse(String(formData.get("horarios_estructurados") ?? "[]"));
      } catch {
        return [];
      }
    })(),
    rating_doctoralia: num("rating_doctoralia"),
    resenas_doctoralia: num("resenas_doctoralia"),
    tipo_negocio: str("tipo_negocio"),
    servicios_adicionales: String(formData.get("servicios_adicionales") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    tiene_oferta: Boolean(str("detalle_oferta")),
    detalle_oferta: str("detalle_oferta"),
    descripcion_extendida: str("descripcion_extendida"),
    video_url: str("video_url"),
    reserva_online_url: str("reserva_online_url"),
    medicos,
    opiniones,
  };
}

export async function createClinic(formData: FormData) {
  await requireAdmin();
  const fields = readClinicFields(formData);

  if (!fields.nombre) {
    redirect(
      `/admin/clinicas/nueva?error=${encodeURIComponent("El nombre es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();

  // Red de seguridad: cualquier fallo no previsto (y no ya convertido en
  // un redirect con mensaje propio) termina aquí con un mensaje legible
  // en vez de una pantalla de error genérica en blanco.
  try {
    let fotos: string[] = [];
    try {
      fotos = await leerFotosConOrden(supabase, formData);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "No se pudieron subir las fotos.";
      redirect(`/admin/clinicas/nueva?error=${encodeURIComponent(message)}`);
    }

    const logoUrl = await subirLogoSiLlega(supabase, formData, "/admin/clinicas/nueva");

    let contenidoPremium: { fotos_antes_despues: Json; certificados: string[] } = {
      fotos_antes_despues: [],
      certificados: [],
    };
    try {
      contenidoPremium = await leerContenidoPremiumConArchivos(supabase, formData);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir el contenido de Perfil ampliado.";
      redirect(`/admin/clinicas/nueva?error=${encodeURIComponent(message)}`);
    }

    const slugPedido = slugify(String(formData.get("slug") ?? "")) || slugify(fields.nombre);
    let slug = slugPedido;
    try {
      slug = await resolverSlug(supabase, slugPedido);
    } catch {
      // Si falla la comprobación de colisión, seguimos con el candidato
      // tal cual — si de verdad colisionara, el unique constraint de la
      // tabla lo detectaría al insertar y se mostraría como error normal.
    }

    const { error } = await supabase.from("clinics").insert({
      ...fields,
      ...contenidoPremium,
      slug,
      fotos,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    });

    if (error) {
      redirect(`/admin/clinicas/nueva?error=${encodeURIComponent(error.message)}`);
    }
  } catch (e) {
    if (esErrorDeRedirect(e)) throw e;
    const message = mensajeConDigest(e, "Error inesperado al crear la clínica.");
    redirect(`/admin/clinicas/nueva?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/clinicas");
  revalidatePath("/centros");
  redirect("/admin/clinicas");
}

export async function deleteClinic(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: clinic } = await supabase
    .from("clinics")
    .select("fotos")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("clinics").delete().eq("id", id);

  if (error) {
    redirect(`/admin/clinicas?error=${encodeURIComponent(error.message)}`);
  }

  if (clinic?.fotos?.length) {
    try {
      await deleteClinicPhotos(supabase, clinic.fotos);
    } catch {
      // La clínica ya se borró; si sobran archivos huérfanos en el
      // Storage no es crítico, se pueden limpiar luego a mano.
    }
  }

  revalidatePath("/admin/clinicas");
  revalidatePath("/centros");
}

export async function updateClinic(id: string, formData: FormData) {
  await requireAdmin();
  const fields = readClinicFields(formData);

  if (!fields.nombre) {
    redirect(
      `/admin/clinicas/${id}/editar?error=${encodeURIComponent("El nombre es obligatorio.")}`,
    );
  }

  const supabase = createAdminClient();

  // Red de seguridad: cualquier fallo no previsto (y no ya convertido en
  // un redirect con mensaje propio) termina aquí con un mensaje legible
  // en vez de una pantalla de error genérica en blanco.
  try {
    const { data: existente } = await supabase
      .from("clinics")
      .select("fotos, fotos_antes_despues, certificados")
      .eq("id", id)
      .maybeSingle();

    let fotos: string[] = [];
    try {
      fotos = await leerFotosConOrden(supabase, formData);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "No se pudieron subir las fotos.";
      redirect(`/admin/clinicas/${id}/editar?error=${encodeURIComponent(message)}`);
    }

    const fotosEliminadas = (existente?.fotos ?? []).filter((url) => !fotos.includes(url));
    if (fotosEliminadas.length > 0) {
      try {
        await deleteClinicPhotos(supabase, fotosEliminadas);
      } catch {
        // No crítico — mejor guardar el resto de cambios que hacer fallar
        // todo el formulario por esto; los archivos huérfanos en el
        // Storage se pueden limpiar luego a mano.
      }
    }

    const logoUrl = await subirLogoSiLlega(supabase, formData, `/admin/clinicas/${id}/editar`);

    let contenidoPremium: { fotos_antes_despues: Json; certificados: string[] } = {
      fotos_antes_despues: [],
      certificados: existente?.certificados ?? [],
    };
    try {
      contenidoPremium = await leerContenidoPremiumConArchivos(supabase, formData, {
        fotos_antes_despues: existente?.fotos_antes_despues,
        certificados: existente?.certificados ?? null,
      });
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir el contenido de Perfil ampliado.";
      redirect(`/admin/clinicas/${id}/editar?error=${encodeURIComponent(message)}`);
    }

    // El slug solo cambia si el admin lo ha editado a mano en el
    // formulario (ver CampoSlug) — si cambia, el anterior se guarda en
    // slugs_antiguos para que cualquier enlace ya compartido o indexado
    // siga redirigiendo a la ficha en vez de dar 404. El slug/slugs_antiguos
    // "actuales" vienen del propio formulario (hidden fields) en vez de
    // releerse de la BD, para no depender de una consulta más que pueda
    // fallar en mitad del guardado.
    let slugUpdate: { slug: string; slugs_antiguos: string[] } | undefined;
    const slugActual = String(formData.get("slug_actual") ?? "");
    const slugPedido = slugify(String(formData.get("slug") ?? "")) || slugify(fields.nombre);
    if (slugActual && slugPedido && slugPedido !== slugActual) {
      let slugsAntiguosActuales: string[] = [];
      try {
        const parseado = JSON.parse(String(formData.get("slugs_antiguos_actual") ?? "[]"));
        if (Array.isArray(parseado)) slugsAntiguosActuales = parseado;
      } catch {
        slugsAntiguosActuales = [];
      }
      let nuevoSlug = slugPedido;
      try {
        nuevoSlug = await resolverSlug(supabase, slugPedido, id);
      } catch {
        // Si falla la comprobación de colisión, seguimos con el candidato
        // tal cual — si de verdad colisionara, el unique constraint de la
        // tabla lo detectaría al guardar y se mostraría como error normal.
      }
      slugUpdate = {
        slug: nuevoSlug,
        slugs_antiguos: Array.from(new Set([...slugsAntiguosActuales, slugActual])),
      };
    }

    // Las solicitudes pendientes (destacado/premium) ya no se resuelven
    // aquí: las gestionan en exclusiva activarVisibilidad/rechazarVisibilidad
    // desde la sección Visibilidad — así guardar un cambio cualquiera (por
    // ejemplo el teléfono) nunca rechaza en silencio una solicitud que el
    // admin aún no ha revisado.
    const { error } = await supabase
      .from("clinics")
      .update({
        ...fields,
        ...contenidoPremium,
        fotos,
        ...(logoUrl ? { logo_url: logoUrl } : {}),
        ...(slugUpdate ?? {}),
      })
      .eq("id", id);

    if (error) {
      redirect(
        `/admin/clinicas/${id}/editar?error=${encodeURIComponent(error.message)}`,
      );
    }
  } catch (e) {
    if (esErrorDeRedirect(e)) throw e;
    const message = mensajeConDigest(e, "Error inesperado al guardar los cambios.");
    redirect(`/admin/clinicas/${id}/editar?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/clinicas");
  revalidatePath("/centros");
  revalidatePath(`/admin/clinicas/${id}/editar`);
  // Nos quedamos en la misma ficha en vez de volver al listado — el
  // admin suele seguir editando otras cosas de la misma clínica justo
  // después de guardar.
  redirect(`/admin/clinicas/${id}/editar?guardado=1`);
}

export async function moveClinic(id: string, direction: "up" | "down") {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("clinics")
    .select("id, destacado")
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const list = data ?? [];
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return;
  // No cruzar entre el grupo de destacadas y el resto.
  if (list[index].destacado !== list[swapIndex].destacado) return;

  [list[index], list[swapIndex]] = [list[swapIndex], list[index]];

  // Reasignamos un orden secuencial a toda la lista: así el movimiento
  // funciona siempre, aunque varias filas partieran con el mismo valor.
  await Promise.all(
    list.map((c, i) =>
      supabase.from("clinics").update({ orden: i }).eq("id", c.id),
    ),
  );

  revalidatePath("/admin/clinicas");
  revalidatePath("/centros");
}

/** Activa ("Publicada") o desactiva varias clínicas de golpe, desde los checkboxes del listado. */
export async function setPublicadoBatch(ids: string[], publicado: boolean) {
  await requireAdmin();
  if (ids.length === 0) return;
  const supabase = createAdminClient();
  await supabase.from("clinics").update({ publicado }).in("id", ids);

  revalidatePath("/admin/clinicas");
  revalidatePath("/centros");
}

/** Igual que deleteClinic pero para varias a la vez, desde los checkboxes del listado. */
export async function deleteClinicsBatch(ids: string[]) {
  await requireAdmin();
  if (ids.length === 0) return;
  const supabase = createAdminClient();

  const { data: aBorrar } = await supabase
    .from("clinics")
    .select("fotos")
    .in("id", ids);

  await supabase.from("clinics").delete().in("id", ids);

  const fotos = (aBorrar ?? []).flatMap((c) => c.fotos ?? []);
  if (fotos.length > 0) {
    try {
      await deleteClinicPhotos(supabase, fotos);
    } catch {
      // Las clínicas ya se borraron; archivos huérfanos en el Storage
      // no son críticos, se pueden limpiar luego a mano.
    }
  }

  revalidatePath("/admin/clinicas");
  revalidatePath("/centros");
}
