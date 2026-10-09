"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";

export type TipoVisibilidad =
  | "destacado"
  | "destacado_home"
  | "destacado_ciudad"
  | "premium";

type FechasVisibilidad = Record<
  string,
  { activado_en: string; expira_en: string | null }
>;

// Mismos textos que ve la clínica en /clinica/visibilidad — si cambian
// ahí, cambiarlos también aquí para que el email no se desincronice.
const TIPO_LABEL: Record<TipoVisibilidad, string> = {
  destacado: "Destacada en el listado",
  destacado_home: "Destacada en la Home",
  destacado_ciudad: "Destacada en tu ciudad",
  premium: "Perfil ampliado",
};

// Mismo beneficio que ve la clínica en la tarjeta de /clinica/visibilidad.
const BENEFICIO_LABEL: Record<TipoVisibilidad, string> = {
  destacado: "Más pacientes te ven primero al comparar clínicas de tu zona.",
  destacado_home: "Visibilidad máxima: es lo primero que ve cualquier visitante de Growwly.",
  destacado_ciudad: "Ganas a la competencia local cuando buscan clínicas cerca.",
  premium: "Ficha completa = más confianza del paciente = más leads convertidos.",
};

type EstadisticasClinica = {
  impresiones: number;
  visitasFicha: number;
  leadsRecibidos: number;
};

async function leerEstadisticasClinica(
  supabase: ReturnType<typeof createAdminClient>,
  clinicId: string,
): Promise<EstadisticasClinica> {
  const [{ count: impresiones }, { count: visitasFicha }, { count: leadsRecibidos }] =
    await Promise.all([
      supabase
        .from("clinic_impresiones_listado")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId),
      supabase
        .from("clinic_page_views")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId),
      supabase
        .from("leads_clinica")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId),
    ]);

  return {
    impresiones: impresiones ?? 0,
    visitasFicha: visitasFicha ?? 0,
    leadsRecibidos: leadsRecibidos ?? 0,
  };
}

async function registrarLogVisibilidad(
  supabase: ReturnType<typeof createAdminClient>,
  datos: {
    clinicId: string;
    tipo: TipoVisibilidad;
    accion: "alta" | "baja";
    mesesDuracion: number | null;
    expiraEn: string | null;
    motivo: "aprobado_admin" | "desactivado_admin" | "expirado";
  },
) {
  await supabase.from("clinic_visibilidad_log").insert({
    clinic_id: datos.clinicId,
    tipo: datos.tipo,
    accion: datos.accion,
    meses_duracion: datos.mesesDuracion,
    expira_en: datos.expiraEn,
    motivo: datos.motivo,
  });
}

function construirHtmlEmailActivacion(datos: {
  nombreClinica: string;
  tituloTipo: string;
  beneficio: string;
  estadisticas: EstadisticasClinica;
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `
    <div style="font-family: Arial, sans-serif; color: #33403f; max-width: 480px; margin: 0 auto;">
      <p style="color: #00768f; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; font-size: 12px;">Growwly</p>
      <h1 style="font-size: 20px; color: #00566b;">¡Gracias por confiar en Growwly!</h1>
      <p>Buenos días ${datos.nombreClinica},</p>
      <p>
        Queríamos darte las gracias personalmente por seguir invirtiendo en que más
        pacientes os encuentren. Tu clínica ya tiene el modo
        <strong>"${datos.tituloTipo}"</strong> activado.
      </p>
      <p>${datos.beneficio}</p>
      <div style="margin: 24px 0; border-radius: 12px; background: #eef6f1; padding: 16px 20px;">
        <p style="margin: 0 0 8px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.04em; color: #1f5568;">
          Así de visible eres ahora mismo en Growwly
        </p>
        <p style="margin: 0; font-size: 14px;">
          👀 <strong>${datos.estadisticas.impresiones}</strong> veces se ha visto tu tarjeta en listados
        </p>
        <p style="margin: 4px 0 0; font-size: 14px;">
          📄 <strong>${datos.estadisticas.visitasFicha}</strong> visitas a tu ficha completa
        </p>
        <p style="margin: 4px 0 0; font-size: 14px;">
          📬 <strong>${datos.estadisticas.leadsRecibidos}</strong> solicitudes de pacientes recibidas
        </p>
      </div>
      <p>
        Lo que acabas de activar está pensado justo para mover estos números hacia
        arriba. Puedes seguir la evolución en cualquier momento desde tu panel.
      </p>
      <p style="margin-top: 24px;">
        <a href="${siteUrl}/clinica/estadisticas" style="background:#00c2d6; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold; display:inline-block;">
          Ver mis estadísticas →
        </a>
      </p>
      <p style="margin-top: 16px; font-size: 13px;">
        Un abrazo,<br />el equipo de Growwly
      </p>
    </div>
  `;
}

function revalidarTodo() {
  revalidatePath("/admin/visibilidad");
  revalidatePath("/admin/clinicas");
  revalidatePath("/clinicas");
  revalidatePath("/");
}

async function leerFechas(
  supabase: ReturnType<typeof createAdminClient>,
  clinicId: string,
): Promise<FechasVisibilidad> {
  const { data } = await supabase
    .from("clinics")
    .select("visibilidad_fechas")
    .eq("id", clinicId)
    .maybeSingle();
  const fechas = data?.visibilidad_fechas;
  return fechas && typeof fechas === "object" && !Array.isArray(fechas)
    ? (fechas as FechasVisibilidad)
    : {};
}

/**
 * Activa un tipo de visibilidad con una duración concreta (o
 * indefinida si mesesDuracion es null), aprobando la solicitud si la
 * había. Guarda cuándo se activó y cuándo caduca, para poder facturar
 * por días activos y para que se desactive sola al llegar la fecha
 * (ver /api/cron/expirar-visibilidad).
 */
export async function activarVisibilidad(
  clinicId: string,
  tipo: TipoVisibilidad,
  mesesDuracion: number | null,
) {
  const supabase = createAdminClient();

  const ahora = new Date();
  const expira = mesesDuracion
    ? new Date(ahora.getFullYear(), ahora.getMonth() + mesesDuracion, ahora.getDate())
    : null;
  const expiraIso = expira ? expira.toISOString() : null;

  const fechas = await leerFechas(supabase, clinicId);
  fechas[tipo] = {
    activado_en: ahora.toISOString(),
    expira_en: expiraIso,
  };

  const camposBase = { visibilidad_fechas: fechas };

  if (tipo === "premium") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, plan: "premium", plan_solicitado: null })
      .eq("id", clinicId);
  } else if (tipo === "destacado") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, destacado: true, destacado_solicitado: false })
      .eq("id", clinicId);
  } else if (tipo === "destacado_home") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, destacado_home: true, destacado_home_solicitado: false })
      .eq("id", clinicId);
  } else {
    await supabase
      .from("clinics")
      .update({
        ...camposBase,
        destacado_ciudad: true,
        destacado_ciudad_solicitado: false,
      })
      .eq("id", clinicId);
  }

  await registrarLogVisibilidad(supabase, {
    clinicId,
    tipo,
    accion: "alta",
    mesesDuracion,
    expiraEn: expiraIso,
    motivo: "aprobado_admin",
  });

  const { data: clinic } = await supabase
    .from("clinics")
    .select("nombre, email")
    .eq("id", clinicId)
    .maybeSingle();
  if (clinic?.email) {
    try {
      const estadisticas = await leerEstadisticasClinica(supabase, clinicId);
      await enviarEmail({
        to: clinic.email,
        subject: `Ya tienes "${TIPO_LABEL[tipo]}" activado en Growwly`,
        html: construirHtmlEmailActivacion({
          nombreClinica: clinic.nombre,
          tituloTipo: TIPO_LABEL[tipo],
          beneficio: BENEFICIO_LABEL[tipo],
          estadisticas,
        }),
      });
    } catch {
      // Un fallo de envío no debe impedir que la activación quede
      // guardada — el admin ya ve el estado activo en el panel aunque
      // el aviso por email no llegara.
    }
  }

  revalidarTodo();
}

/** Desactiva directamente y limpia sus fechas. */
export async function desactivarVisibilidad(
  clinicId: string,
  tipo: TipoVisibilidad,
) {
  const supabase = createAdminClient();

  const fechas = await leerFechas(supabase, clinicId);
  delete fechas[tipo];
  const camposBase = { visibilidad_fechas: fechas };

  if (tipo === "premium") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, plan: "basico", plan_solicitado: null })
      .eq("id", clinicId);
  } else if (tipo === "destacado") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, destacado: false, destacado_solicitado: false })
      .eq("id", clinicId);
  } else if (tipo === "destacado_home") {
    await supabase
      .from("clinics")
      .update({ ...camposBase, destacado_home: false, destacado_home_solicitado: false })
      .eq("id", clinicId);
  } else {
    await supabase
      .from("clinics")
      .update({
        ...camposBase,
        destacado_ciudad: false,
        destacado_ciudad_solicitado: false,
      })
      .eq("id", clinicId);
  }

  await registrarLogVisibilidad(supabase, {
    clinicId,
    tipo,
    accion: "baja",
    mesesDuracion: null,
    expiraEn: null,
    motivo: "desactivado_admin",
  });

  revalidarTodo();
}

/** Rechaza una solicitud pendiente sin activar nada. */
export async function rechazarVisibilidad(
  clinicId: string,
  tipo: TipoVisibilidad,
) {
  const supabase = createAdminClient();

  if (tipo === "premium") {
    await supabase.from("clinics").update({ plan_solicitado: null }).eq("id", clinicId);
  } else if (tipo === "destacado") {
    await supabase
      .from("clinics")
      .update({ destacado_solicitado: false })
      .eq("id", clinicId);
  } else if (tipo === "destacado_home") {
    await supabase
      .from("clinics")
      .update({ destacado_home_solicitado: false })
      .eq("id", clinicId);
  } else {
    await supabase
      .from("clinics")
      .update({ destacado_ciudad_solicitado: false })
      .eq("id", clinicId);
  }

  revalidarTodo();
}
