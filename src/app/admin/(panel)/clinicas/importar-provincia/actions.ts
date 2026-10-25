"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROVINCIAS_ESPANA } from "@/lib/clinic-options";
import { lanzarBusqueda, estadoRun, resultadosDataset, describirZona, type ZonaBusqueda } from "@/lib/importador/apify";
import { clasificar, municipioDe } from "@/lib/importador/provincia";
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

/** Consulta Apify y, si ha terminado, guarda los candidatos filtrados. */
export async function actualizarImportacion(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const ruta = `${RUTA}/${id}`;
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data: imp } = await supabase.from("importaciones_provincia").select("*").eq("id", id).single();
    if (!imp) throw new Error("Importación no encontrada.");
    if (imp.estado === "cargada") return;

    const run = await estadoRun(imp.run_id);
    if (["READY", "RUNNING"].includes(run.status)) {
      revalidatePath(ruta);
      return;
    }
    if (run.status !== "SUCCEEDED" && run.status !== "TIMED-OUT" && run.status !== "ABORTED") {
      await supabase.from("importaciones_provincia").update({ estado: "fallida" }).eq("id", id);
      throw new Error(`La búsqueda en Apify terminó con estado ${run.status}.`);
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
  } catch (e) {
    conError(ruta, e);
  }
  revalidatePath(ruta);
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
