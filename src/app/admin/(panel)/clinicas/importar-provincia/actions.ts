"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROVINCIAS_ESPANA } from "@/lib/clinic-options";
import { lanzarBusqueda, estadoRun, resultadosDataset, totalDataset, describirZona, type ZonaBusqueda } from "@/lib/importador/apify";
import { clasificar, municipioDe, comunidadDe, telefonoNacional, horariosTexto } from "@/lib/importador/provincia";
import { slugify } from "@/lib/slugify";
import type { LugarApify } from "@/lib/importador/apify";
import type { Json } from "@/lib/supabase/database.types";

const RUTA = "/admin/clinicas/importar-provincia";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión caducada. Vuelve a entrar en el panel.");
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("No autorizado.");
}

function conError(ruta: string, e: unknown): never {
  const msg = e instanceof Error ? e.message : "Error inesperado.";
  redirect(`${ruta}?error=${encodeURIComponent(msg)}`);
}

export async function lanzarImportacion(formData: FormData) {
  let id: string;
  try {
    await requireAdmin();
    const provincia = String(formData.get("provincia") ?? "");
    if (!(PROVINCIAS_ESPANA as readonly string[]).includes(provincia)) throw new Error("Elige una provincia.");
    const texto = String(formData.get("zona") ?? "").trim();
    const zona: ZonaBusqueda = texto ? { texto } : { provincia };
    const maxPorBusqueda = Math.min(Math.max(Number(formData.get("max_por_busqueda")) || 100, 10), 500);
    const maxGasto = Math.min(Math.max(Number(formData.get("max_gasto")) || 15, 1), 100);

    const run = await lanzarBusqueda(zona, maxPorBusqueda, maxGasto);
    const { data, error } = await createAdminClient()
      .from("importaciones_provincia")
      .insert({ provincia, zona_busqueda: describirZona(zona), run_id: run.id, dataset_id: run.defaultDatasetId })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "No se pudo guardar la importación.");
    id = data.id;
  } catch (e) {
    conError(RUTA, e);
  }
  redirect(`${RUTA}/${id}`);
}

export type Progreso =
  | { estado: "en_curso"; encontrados: number; mensaje: string | null }
  | { estado: "cargada"; total: number }
  | { estado: "fallida"; mensaje: string };

/**
 * Consulta Apify; si ha terminado, guarda los candidatos filtrados.
 * La pantalla lo llama sola cada pocos segundos mientras busca.
 */
async function procesar(id: string): Promise<Progreso> {
  const supabase = createAdminClient();
  const { data: imp } = await supabase.from("importaciones_provincia").select("*").eq("id", id).single();
  if (!imp) throw new Error("Importación no encontrada.");
  if (imp.estado === "cargada") return { estado: "cargada", total: imp.total_resultados ?? 0 };

  const run = await estadoRun(imp.run_id);
  if (["READY", "RUNNING"].includes(run.status)) {
    const encontrados = await totalDataset(run.defaultDatasetId).catch(() => 0);
    return { estado: "en_curso", encontrados, mensaje: run.statusMessage ?? null };
  }
  if (run.status !== "SUCCEEDED" && run.status !== "TIMED-OUT" && run.status !== "ABORTED") {
    await supabase.from("importaciones_provincia").update({ estado: "fallida" }).eq("id", id);
    return { estado: "fallida", mensaje: `La búsqueda en Apify terminó con estado ${run.status}.` };
  }
  // TIMED-OUT / ABORTED (p. ej. al llegar al tope de gasto) también
  // dejan resultados válidos: se cargan los que haya.

  const lugares = await resultadosDataset(run.defaultDatasetId);

  const { data: existentes } = await supabase
    .from("clinics")
    .select("id, google_place_id")
    .not("google_place_id", "is", null);
  const yaEnGrowwly = new Map((existentes ?? []).map((c) => [c.google_place_id!, c.id]));

  const vistos = new Set<string>();
  const filas = [];
  const municipios = new Set<string>();
  for (const l of lugares) {
    if (!l.placeId || !l.title || vistos.has(l.placeId)) continue;
    vistos.add(l.placeId);
    const c = clasificar(l, imp.provincia);
    const clinicId = yaEnGrowwly.get(l.placeId) ?? null;
    const municipio = municipioDe(l);
    if (c.estado === "pendiente" && municipio) municipios.add(municipio);
    filas.push({
      importacion_id: id,
      place_id: l.placeId,
      nombre: l.title,
      categoria: l.categoryName ?? null,
      direccion: l.address ?? null,
      municipio,
      telefono: l.phoneUnformatted ?? l.phone ?? null,
      web: l.website ?? null,
      rating: l.totalScore ?? null,
      resenas: l.reviewsCount ?? null,
      maps_url: l.url ?? null,
      datos: l as unknown as Json,
      estado: clinicId ? "ya_en_growwly" : c.estado,
      motivo: clinicId ? "Ya existe en Growwly" : c.motivo,
      clinic_id: clinicId,
    });
  }

  for (let i = 0; i < filas.length; i += 500) {
    const { error } = await supabase
      .from("importacion_candidatos")
      .upsert(filas.slice(i, i + 500), { onConflict: "importacion_id,place_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }

  // Municipios con centros, para que la ficha pueda elegirlos en el desplegable.
  if (municipios.size) {
    await supabase
      .from("municipios")
      .upsert(
        Array.from(municipios).map((nombre) => ({ provincia: imp.provincia, nombre })),
        { onConflict: "provincia,nombre", ignoreDuplicates: true },
      );
  }

  await supabase
    .from("importaciones_provincia")
    .update({ estado: "cargada", total_resultados: filas.length, cargada_at: new Date().toISOString() })
    .eq("id", id);
  return { estado: "cargada", total: filas.length };
}

export async function comprobarProgreso(id: string): Promise<Progreso> {
  try {
    await requireAdmin();
    const p = await procesar(id);
    if (p.estado !== "en_curso") revalidatePath(`${RUTA}/${id}`);
    return p;
  } catch (e) {
    // Un fallo puntual de red no corta el seguimiento: se reintenta en la siguiente vuelta.
    console.error(e);
    return { estado: "en_curso", encontrados: 0, mensaje: e instanceof Error ? e.message : null };
  }
}

export async function cambiarEstadoCandidato(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const importacionId = String(formData.get("importacion_id") ?? "");
  const estado = String(formData.get("estado") ?? "");
  try {
    await requireAdmin();
    if (!["pendiente", "descartado"].includes(estado)) throw new Error("Estado no válido.");
    await createAdminClient()
      .from("importacion_candidatos")
      .update({ estado, motivo: estado === "descartado" ? "Descartado a mano" : null })
      .eq("id", id)
      .in("estado", ["pendiente", "descartado"]);
  } catch (e) {
    conError(`${RUTA}/${importacionId}`, e);
  }
  revalidatePath(`${RUTA}/${importacionId}`);
}

export type ResultadoRevision = { ok: true; creadas: number; eliminadas: number; avisos: string[] } | { ok: false; error: string };

/**
 * Aplica de golpe la revisión hecha en pantalla: los "viables" se crean
 * como fichas sin publicar con los datos de Google Maps (luego se
 * completan desde su web) y los marcados para eliminar se borran.
 */
export async function aplicarRevision(
  importacionId: string,
  viables: string[],
  eliminar: string[],
): Promise<ResultadoRevision> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data: imp } = await supabase
      .from("importaciones_provincia")
      .select("provincia")
      .eq("id", importacionId)
      .single();
    if (!imp) throw new Error("Importación no encontrada.");

    let eliminadas = 0;
    if (eliminar.length) {
      const { data, error } = await supabase
        .from("importacion_candidatos")
        .delete()
        .eq("importacion_id", importacionId)
        .in("id", eliminar)
        .in("estado", ["pendiente", "descartado"])
        .select("id");
      if (error) throw new Error(error.message);
      eliminadas = data?.length ?? 0;
    }

    const avisos: string[] = [];
    let creadas = 0;
    if (viables.length) {
      const { data: candidatos } = await supabase
        .from("importacion_candidatos")
        .select("*")
        .eq("importacion_id", importacionId)
        .in("id", viables)
        .in("estado", ["pendiente", "descartado"]);

      const { data: existentes } = await supabase.from("clinics").select("slug, google_place_id");
      const slugs = new Set((existentes ?? []).map((c) => c.slug));
      const placeIds = new Set((existentes ?? []).map((c) => c.google_place_id).filter(Boolean));

      for (const c of candidatos ?? []) {
        if (placeIds.has(c.place_id)) {
          avisos.push(`${c.nombre}: ya estaba en Growwly.`);
          continue;
        }
        const l = (c.datos ?? {}) as LugarApify;
        const base = slugify(`${c.nombre}${c.municipio ? `-${c.municipio}` : ""}`) || "centro";
        let slug = slugify(c.nombre) || base;
        if (slugs.has(slug)) slug = base;
        for (let n = 2; slugs.has(slug); n++) slug = `${base}-${n}`;
        slugs.add(slug);

        const telefono = telefonoNacional(c.telefono);
        const redes: Record<string, string> = {};
        if (l.instagrams?.[0]) redes.instagram = l.instagrams[0];
        if (l.facebooks?.[0]) redes.facebook = l.facebooks[0];
        if (l.tiktoks?.[0]) redes.tiktok = l.tiktoks[0];

        const { data: creada, error } = await supabase
          .from("clinics")
          .insert({
            nombre: c.nombre,
            slug,
            provincia: imp.provincia,
            comunidad_autonoma: comunidadDe(imp.provincia),
            ciudad: c.municipio,
            direccion: c.direccion,
            telefono,
            telefono_es_movil: telefono ? /^[67]/.test(telefono) : true,
            email: l.emails?.[0] ?? null,
            web: c.web,
            redes_sociales: redes,
            lat: l.location?.lat ?? null,
            lng: l.location?.lng ?? null,
            google_place_id: c.place_id,
            google_maps_url: c.maps_url,
            rating_google: c.rating,
            resenas_google: c.resenas,
            google_synced_at: new Date().toISOString(),
            horarios: horariosTexto(l),
            // Siempre entra oculta: se completa desde su web y se publica a mano.
            publicado: false,
            verificado: false,
            verificado_admin: false,
            leads_enabled: false,
          })
          .select("id")
          .single();
        if (error || !creada) {
          avisos.push(`${c.nombre}: ${error?.message ?? "no se pudo crear"}`);
          continue;
        }
        placeIds.add(c.place_id);
        await supabase
          .from("importacion_candidatos")
          .update({ estado: "importado", clinic_id: creada.id, motivo: null })
          .eq("id", c.id);
        creadas++;
      }
    }

    revalidatePath(`${RUTA}/${importacionId}`);
    revalidatePath("/admin/clinicas");
    return { ok: true, creadas, eliminadas, avisos };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Error inesperado." };
  }
}
