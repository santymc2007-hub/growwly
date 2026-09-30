import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { contactoLiberado, type EstadoLead } from "@/lib/leads/estados-lead";

export type PuntoSerie = { fecha: string; valor: number };

export type EstadisticasClinica = {
  impresionesTotal: number;
  impresionesPorSuperficie: { superficie: string; total: number }[];
  vistasTotal: number;
  vistasPorDia: PuntoSerie[];
  contactosTotal: number;
  contactosPorMetodo: { metodo: string; total: number }[];
  leadsTotal: number;
  leadsPorEstado: { estado: string; total: number }[];
  leadsPorDia: PuntoSerie[];
  /** % de leads que el paciente llegó a elegir en algún momento (0-1). */
  tasaEleccion: number | null;
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

/**
 * Agrega todo lo que necesita /clinica/estadisticas para un rango de
 * fechas — vistas y contactos vienen de nuestro propio registro (ver
 * migración 20260930100000), los leads de leads_clinica de siempre.
 */
export async function calcularEstadisticasClinica(
  admin: SupabaseClient<Database>,
  clinicId: string,
  desde: Date,
  hasta: Date,
): Promise<EstadisticasClinica> {
  const desdeIso = desde.toISOString();
  const hastaIso = hasta.toISOString();

  const [{ data: impresiones }, { data: vistas }, { data: contactos }, { data: leads }] =
    await Promise.all([
      admin
        .from("clinic_impresiones_listado")
        .select("superficie, created_at")
        .eq("clinic_id", clinicId)
        .gte("created_at", desdeIso)
        .lte("created_at", hastaIso),
      admin
        .from("clinic_page_views")
        .select("created_at")
        .eq("clinic_id", clinicId)
        .gte("created_at", desdeIso)
        .lte("created_at", hastaIso),
      admin
        .from("clinic_contact_clicks")
        .select("metodo, created_at")
        .eq("clinic_id", clinicId)
        .gte("created_at", desdeIso)
        .lte("created_at", hastaIso),
      admin
        .from("leads_clinica")
        .select("estado, enviado_en")
        .eq("clinic_id", clinicId)
        .gte("enviado_en", desdeIso)
        .lte("enviado_en", hastaIso),
    ]);

  const impresionesPorSuperficieMap = new Map<string, number>();
  for (const i of impresiones ?? []) {
    impresionesPorSuperficieMap.set(
      i.superficie,
      (impresionesPorSuperficieMap.get(i.superficie) ?? 0) + 1,
    );
  }

  const contactosPorMetodoMap = new Map<string, number>();
  for (const c of contactos ?? []) {
    contactosPorMetodoMap.set(c.metodo, (contactosPorMetodoMap.get(c.metodo) ?? 0) + 1);
  }

  const leadsPorEstadoMap = new Map<string, number>();
  let elegidos = 0;
  for (const l of leads ?? []) {
    leadsPorEstadoMap.set(l.estado, (leadsPorEstadoMap.get(l.estado) ?? 0) + 1);
    if (contactoLiberado(l.estado as EstadoLead)) elegidos++;
  }

  const totalLeads = leads?.length ?? 0;

  return {
    impresionesTotal: impresiones?.length ?? 0,
    impresionesPorSuperficie: Array.from(impresionesPorSuperficieMap.entries())
      .map(([superficie, total]) => ({ superficie, total }))
      .sort((a, b) => b.total - a.total),
    vistasTotal: vistas?.length ?? 0,
    vistasPorDia: agruparPorDia((vistas ?? []).map((v) => v.created_at), desde, hasta),
    contactosTotal: contactos?.length ?? 0,
    contactosPorMetodo: Array.from(contactosPorMetodoMap.entries())
      .map(([metodo, total]) => ({ metodo, total }))
      .sort((a, b) => b.total - a.total),
    leadsTotal: totalLeads,
    leadsPorEstado: Array.from(leadsPorEstadoMap.entries())
      .map(([estado, total]) => ({ estado, total }))
      .sort((a, b) => b.total - a.total),
    leadsPorDia: agruparPorDia((leads ?? []).map((l) => l.enviado_en), desde, hasta),
    tasaEleccion: totalLeads > 0 ? elegidos / totalLeads : null,
  };
}
