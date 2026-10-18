import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { slugifyCiudad, slugifyProvincia } from "@/lib/clinic-options";
import { clinicaEstaRegistrada } from "@/lib/clinica/registrada";
import {
  MIN_VISITAS_PARA_TRAFICO,
  asuntoEmailReclamo,
  construirEmailReclamo,
  enlaceBajaReclamo,
} from "@/lib/email/reclamo-centro";

export type EstadoReclamo = "sin-email" | "con-cuenta" | "baja" | "pendiente" | "enviado";

type Admin = SupabaseClient<Database>;

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.growwly.es").replace(/\/$/, "");
}

/**
 * Prepara el email "reclama tu ficha" de un centro: comprueba si se le
 * puede enviar y monta el HTML con sus datos reales (incluido el
 * tráfico de los últimos 30 días, solo si llega al mínimo).
 */
export async function prepararEmailReclamo(admin: Admin, clinicId: string) {
  const { data: clinic } = await admin
    .from("clinics")
    .select("id, nombre, email, ciudad, provincia, slug, tipo_negocio, rating_google, resenas_google")
    .eq("id", clinicId)
    .maybeSingle();
  if (!clinic) return { error: "No existe ese centro." } as const;

  const [{ data: aviso }, registrada] = await Promise.all([
    admin.from("clinic_avisos_reclamo").select("enviado_en, baja_en").eq("clinic_id", clinicId).maybeSingle(),
    clinicaEstaRegistrada(admin, clinicId),
  ]);

  const estado: EstadoReclamo = !clinic.email
    ? "sin-email"
    : registrada
      ? "con-cuenta"
      : aviso?.baja_en
        ? "baja"
        : aviso?.enviado_en
          ? "enviado"
          : "pendiente";

  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: impresiones }, { count: visitas }] = await Promise.all([
    admin
      .from("clinic_impresiones_listado")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("created_at", desde),
    admin
      .from("clinic_page_views")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("created_at", desde),
  ]);

  const url = siteUrl();
  const rutaFicha = `/centros/${slugifyProvincia(clinic.provincia)}/${
    clinic.ciudad ? slugifyCiudad(clinic.ciudad) : "sin-ciudad"
  }/${clinic.slug}`;

  const html = construirEmailReclamo({
    siteUrl: url,
    nombre: clinic.nombre,
    ciudad: clinic.ciudad,
    tipoNegocio: clinic.tipo_negocio,
    ratingGoogle: clinic.rating_google,
    resenasGoogle: clinic.resenas_google,
    urlFicha: `${url}${rutaFicha}`,
    urlReclamar: `${url}/clinica/registro?clinic=${clinic.id}`,
    urlBaja: enlaceBajaReclamo(url, clinic.id),
    trafico:
      (visitas ?? 0) >= MIN_VISITAS_PARA_TRAFICO
        ? { impresiones: impresiones ?? 0, visitas: visitas ?? 0 }
        : null,
  });

  return {
    clinic,
    estado,
    enviadoEn: aviso?.enviado_en ?? null,
    asunto: asuntoEmailReclamo(clinic.nombre),
    html,
  } as const;
}
