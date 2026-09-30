import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type PuntoSerie = { fecha: string; valor: number };
export type FunnelPaso = { clave: string; etiqueta: string; total: number };
export type Ranking = { clinicId: string; nombre: string; total: number };

export type EstadisticasAdmin = {
  solicitudesCreadas: number;
  visitasTotal: number;
  visitasPorDia: PuntoSerie[];
  funnel: FunnelPaso[];
  porSexo: { etiqueta: string; total: number }[];
  porCiudad: { ciudad: string; total: number }[];
  clinicasMasVistas: Ranking[];
  clinicasMasLeads: Ranking[];
};

const SEXO_LABEL: Record<string, string> = {
  hombre: "Hombre",
  mujer: "Mujer",
  otro: "Otro",
};

function agruparPorDia(fechasIso: string[], desde: Date, hasta: Date): PuntoSerie[] {
  const dias = new Map<string, number>();
  for (
    const cursor = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
    cursor <= hasta;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    dias.set(cursor.toISOString().slice(0, 10), 0);
  }
  for (const fecha of fechasIso) {
    const clave = fecha.slice(0, 10);
    if (dias.has(clave)) dias.set(clave, (dias.get(clave) ?? 0) + 1);
  }
  return Array.from(dias.entries()).map(([fecha, valor]) => ({ fecha, valor }));
}

function topN<T extends string>(
  contador: Map<T, number>,
  n: number,
): { clave: T; total: number }[] {
  return Array.from(contador.entries())
    .map(([clave, total]) => ({ clave, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
}

/**
 * Agrega los datos del panel /admin/estadisticas para un rango de
 * fechas. Todo sale de nuestra propia base de datos (nada de Google
 * Analytics aquí) — sexo/ciudad de pacientes, vistas/leads de
 * clínicas y el funnel de negocio ya viven en Supabase.
 */
export async function calcularEstadisticasAdmin(
  admin: SupabaseClient<Database>,
  desde: Date,
  hasta: Date,
  filtro?: { provincia?: string },
): Promise<EstadisticasAdmin> {
  const desdeIso = desde.toISOString();
  const hastaIso = hasta.toISOString();

  // Si hay filtro de provincia, todo se restringe a las clínicas de esa
  // provincia — leads y vistas por clinic_id directamente, solicitudes
  // por las que llegaron a alguna de esas clínicas (no tienen provincia
  // propia, solo ciudad del paciente).
  let clinicIdsFiltro: string[] | null = null;
  if (filtro?.provincia) {
    const { data: clinicasProvincia } = await admin
      .from("clinics")
      .select("id")
      .eq("provincia", filtro.provincia);
    clinicIdsFiltro = (clinicasProvincia ?? []).map((c) => c.id);
  }

  let leadsQuery = admin
    .from("leads_clinica")
    .select(
      "clinic_id, solicitud_id, propuesta_enviada_en, seleccionado_en, cita_realizada_en, convertido_en",
    )
    .gte("enviado_en", desdeIso)
    .lte("enviado_en", hastaIso);
  if (clinicIdsFiltro) leadsQuery = leadsQuery.in("clinic_id", clinicIdsFiltro);

  let vistasQuery = admin
    .from("clinic_page_views")
    .select("clinic_id, created_at")
    .gte("created_at", desdeIso)
    .lte("created_at", hastaIso);
  if (clinicIdsFiltro) vistasQuery = vistasQuery.in("clinic_id", clinicIdsFiltro);

  const [{ data: leads }, { data: vistas }] = await Promise.all([leadsQuery, vistasQuery]);

  let solicitudesQuery = admin
    .from("solicitudes_presupuesto")
    .select("id, ciudad, user_id, created_at")
    .gte("created_at", desdeIso)
    .lte("created_at", hastaIso);
  if (clinicIdsFiltro) {
    const solicitudIds = Array.from(new Set((leads ?? []).map((l) => l.solicitud_id)));
    solicitudesQuery =
      solicitudIds.length > 0
        ? solicitudesQuery.in("id", solicitudIds)
        : solicitudesQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  }
  const { data: solicitudes } = await solicitudesQuery;

  // --- Funnel de negocio ---
  const leadsList = leads ?? [];
  const funnel: FunnelPaso[] = [
    { clave: "solicitudes", etiqueta: "Solicitudes creadas", total: solicitudes?.length ?? 0 },
    { clave: "leads", etiqueta: "Leads asignados a clínicas", total: leadsList.length },
    {
      clave: "propuesta",
      etiqueta: "Con propuesta enviada",
      total: leadsList.filter((l) => l.propuesta_enviada_en).length,
    },
    {
      clave: "elegida",
      etiqueta: "Clínica elegida",
      total: leadsList.filter((l) => l.seleccionado_en).length,
    },
    {
      clave: "cita",
      etiqueta: "Cita realizada",
      total: leadsList.filter((l) => l.cita_realizada_en).length,
    },
    {
      clave: "convertido",
      etiqueta: "Tratamiento realizado",
      total: leadsList.filter((l) => l.convertido_en).length,
    },
  ];

  // --- Ciudad (de las solicitudes) ---
  const porCiudadMap = new Map<string, number>();
  for (const s of solicitudes ?? []) {
    if (!s.ciudad) continue;
    porCiudadMap.set(s.ciudad, (porCiudadMap.get(s.ciudad) ?? 0) + 1);
  }
  const porCiudad = topN(porCiudadMap, 8).map((c) => ({ ciudad: c.clave, total: c.total }));

  // --- Sexo (de los perfiles que hicieron esas solicitudes) ---
  const userIds = Array.from(new Set((solicitudes ?? []).map((s) => s.user_id).filter(Boolean)));
  let porSexo: { etiqueta: string; total: number }[] = [];
  if (userIds.length > 0) {
    const { data: perfiles } = await admin.from("profiles").select("sexo").in("id", userIds);
    const map = new Map<string, number>();
    for (const p of perfiles ?? []) {
      const clave = p.sexo ?? "sin_especificar";
      map.set(clave, (map.get(clave) ?? 0) + 1);
    }
    porSexo = Array.from(map.entries())
      .map(([sexo, total]) => ({ etiqueta: SEXO_LABEL[sexo] ?? "Sin especificar", total }))
      .sort((a, b) => b.total - a.total);
  }

  // --- Vistas (total + serie diaria + ranking de clínicas) ---
  const vistasList = vistas ?? [];
  const vistasPorClinica = new Map<string, number>();
  for (const v of vistasList) {
    vistasPorClinica.set(v.clinic_id, (vistasPorClinica.get(v.clinic_id) ?? 0) + 1);
  }

  // --- Ranking de leads por clínica ---
  const leadsPorClinica = new Map<string, number>();
  for (const l of leadsList) {
    leadsPorClinica.set(l.clinic_id, (leadsPorClinica.get(l.clinic_id) ?? 0) + 1);
  }

  const topVistas = topN(vistasPorClinica, 5);
  const topLeads = topN(leadsPorClinica, 5);
  const idsClinicas = Array.from(
    new Set([...topVistas.map((v) => v.clave), ...topLeads.map((v) => v.clave)]),
  );
  const nombresPorId = new Map<string, string>();
  if (idsClinicas.length > 0) {
    const { data: clinicasNombres } = await admin
      .from("clinics")
      .select("id, nombre")
      .in("id", idsClinicas);
    for (const c of clinicasNombres ?? []) nombresPorId.set(c.id, c.nombre);
  }

  return {
    solicitudesCreadas: solicitudes?.length ?? 0,
    visitasTotal: vistasList.length,
    visitasPorDia: agruparPorDia(
      vistasList.map((v) => v.created_at),
      desde,
      hasta,
    ),
    funnel,
    porSexo,
    porCiudad,
    clinicasMasVistas: topVistas.map((v) => ({
      clinicId: v.clave,
      nombre: nombresPorId.get(v.clave) ?? "—",
      total: v.total,
    })),
    clinicasMasLeads: topLeads.map((v) => ({
      clinicId: v.clave,
      nombre: nombresPorId.get(v.clave) ?? "—",
      total: v.total,
    })),
  };
}
