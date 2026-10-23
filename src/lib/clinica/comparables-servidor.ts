import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  FINANCIACION_OPCIONES,
  PARKING_OPCIONES,
  QUIEN_OPERA_OPCIONES,
  parsearFilasPrecio,
  rangoDeFila,
  type FilaPrecio,
} from "./comparables";

type Admin = SupabaseClient<Database>;

/** Lo que necesita el formulario de la ficha (panel de clínica). */
export async function leerComparablesFicha(admin: Admin, clinicId: string) {
  const [{ data: precios }, { data: ventajas }, { data: marcadas }, { data: tratamientos }] =
    await Promise.all([
      admin
        .from("clinic_precios")
        .select("tratamiento, modalidad, desde, hasta, norwood, nota, visible")
        .eq("clinic_id", clinicId)
        .order("orden"),
      admin
        .from("ventajas")
        .select("id, nombre, categoria, estado, propuesta_por")
        .in("estado", ["aprobada", "propuesta"])
        .order("orden"),
      admin.from("clinic_ventajas").select("ventaja_id").eq("clinic_id", clinicId),
      admin.from("tratamientos").select("nombre").order("nombre"),
    ]);

  return {
    precios: parsearFilasPrecio(JSON.stringify(precios ?? [])),
    sugerenciasTratamientos: (tratamientos ?? []).map((t) => t.nombre),
    ventajas: (ventajas ?? [])
      .filter((v) => v.estado === "aprobada")
      .map(({ id, nombre, categoria }) => ({ id, nombre, categoria })),
    seleccionadas: (marcadas ?? []).map((m) => m.ventaja_id),
    propuestas: (ventajas ?? [])
      .filter((v) => v.estado === "propuesta" && v.propuesta_por === clinicId)
      .map(({ id, nombre }) => ({ id, nombre })),
  };
}

function opcion<T extends readonly { valor: string }[]>(lista: T, v: FormDataEntryValue | null) {
  const s = String(v ?? "");
  return lista.some((o) => o.valor === s) ? s : null;
}

function entero(v: FormDataEntryValue | null, max: number): number | null {
  const s = String(v ?? "").replace(/[^\d]/g, "");
  if (!s) return null;
  const n = Number(s);
  return n <= max ? n : max;
}

/**
 * Lee del formulario los campos comparables. Devuelve las columnas de
 * `clinics` a actualizar, incluidas las antiguas que se siguen usando en
 * otras partes (financiacion, servicios_adicionales, precio_desde/hasta)
 * y que ahora se calculan a partir de lo nuevo.
 */
export function camposComparablesDeFormulario(formData: FormData) {
  const financiacionTipo = opcion(FINANCIACION_OPCIONES, formData.get("financiacion_tipo"));
  const garantia = String(formData.get("garantia") ?? "");
  const filas = parsearFilasPrecio(String(formData.get("precios_json") ?? "[]"));

  // Rango general de injerto (lo usan las landings y el match de
  // solicitudes): solo con precios visibles.
  const injertos = filas.filter((f) => f.visible && /injerto|trasplante/i.test(f.tratamiento));
  const rangos = injertos.map(rangoDeFila);
  const desdes = rangos.map((r) => r.desde).filter((n): n is number => n !== null);
  const hastas = rangos.map((r) => r.hasta).filter((n): n is number => n !== null);

  return {
    filas,
    columnas: {
      financiacion_tipo: financiacionTipo,
      financiacion: financiacionTipo !== null && financiacionTipo !== "no",
      parking: opcion(PARKING_OPCIONES, formData.get("parking")),
      quien_opera: opcion(QUIEN_OPERA_OPCIONES, formData.get("quien_opera")),
      revisiones_num: entero(formData.get("revisiones_num"), 20),
      seguimiento_meses: entero(formData.get("seguimiento_meses"), 60),
      garantia: garantia === "si" ? true : garantia === "no" ? false : null,
      garantia_condiciones:
        String(formData.get("garantia_condiciones") ?? "").trim().slice(0, 200) || null,
      max_uf_sesion: entero(formData.get("max_uf_sesion"), 10000),
      anios_experiencia: entero(formData.get("anios_experiencia"), 80),
      injertos_anio: entero(formData.get("injertos_anio"), 100000),
      servicios_adicionales: filas.map((f) => f.tratamiento).slice(0, 20),
      precio_desde: desdes.length ? Math.min(...desdes) : null,
      precio_hasta: hastas.length ? Math.max(...hastas) : null,
      rango_precios: injertos.find((f) => f.nota)?.nota ?? null,
    },
  };
}

/** Sustituye precios y valores añadidos de la clínica, y guarda propuestas. */
export async function guardarTablasComparables(
  admin: Admin,
  clinicId: string,
  filas: FilaPrecio[],
  formData: FormData,
): Promise<string | null> {
  const { error: e1 } = await admin.from("clinic_precios").delete().eq("clinic_id", clinicId);
  if (e1) return "No se pudieron guardar los precios.";
  if (filas.length) {
    const { error } = await admin.from("clinic_precios").insert(
      filas.map((f, i) => ({
        clinic_id: clinicId,
        tratamiento: f.tratamiento,
        modalidad: f.modalidad,
        desde: f.desde,
        hasta: f.hasta,
        norwood: (f.norwood as Json) ?? null,
        nota: f.nota,
        visible: f.visible,
        orden: i,
      })),
    );
    if (error) return "No se pudieron guardar los precios.";
  }

  // Solo se aceptan ids que existen en el catálogo (aprobados o
  // propuestos por esta clínica).
  const marcadas = formData.getAll("ventajas").map(String);
  const { data: validas } = await admin
    .from("ventajas")
    .select("id, estado, propuesta_por")
    .in("id", marcadas.length ? marcadas : ["00000000-0000-0000-0000-000000000000"]);
  const ids = (validas ?? [])
    .filter((v) => v.estado === "aprobada" || v.propuesta_por === clinicId)
    .map((v) => v.id);
  // Las propuestas pendientes de esta clínica se mantienen marcadas.
  const { data: pendientes } = await admin
    .from("ventajas")
    .select("id")
    .eq("estado", "propuesta")
    .eq("propuesta_por", clinicId);

  await admin.from("clinic_ventajas").delete().eq("clinic_id", clinicId);
  const todas = Array.from(new Set([...ids, ...(pendientes ?? []).map((p) => p.id)]));

  // Propuestas nuevas (máx. 5 por guardado).
  const propuestas = formData
    .getAll("ventajas_propuestas")
    .map((v) => String(v).trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 5);
  if (propuestas.length) {
    const { data: creadas } = await admin
      .from("ventajas")
      .insert(propuestas.map((nombre) => ({ nombre, estado: "propuesta", propuesta_por: clinicId })))
      .select("id");
    todas.push(...(creadas ?? []).map((c) => c.id));
  }

  if (todas.length) {
    const { error } = await admin
      .from("clinic_ventajas")
      .insert(todas.map((ventaja_id) => ({ clinic_id: clinicId, ventaja_id })));
    if (error) return "No se pudieron guardar los valores añadidos.";
  }
  return null;
}
