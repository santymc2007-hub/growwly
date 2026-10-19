"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";
import {
  TIPO_LABEL,
  BENEFICIO_LABEL,
  camposDestacado,
  plazasDestacado,
  type TipoVisibilidad,
} from "@/lib/visibilidad/destacados";
import { esc } from "@/lib/email/escapar";

type FechasVisibilidad = Record<
  string,
  { activado_en: string; expira_en: string | null }
>;

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
  const { error } = await supabase.from("clinic_visibilidad_log").insert({
    clinic_id: datos.clinicId,
    tipo: datos.tipo,
    accion: datos.accion,
    meses_duracion: datos.mesesDuracion,
    expira_en: datos.expiraEn,
    motivo: datos.motivo,
  });
  if (error) {
    // El cambio real (en "clinics") ya se guardó antes de llamar aquí —
    // perder una entrada del historial es un problema menor que no debe
    // hacer fallar la activación/desactivación en sí.
    console.error("Error al registrar log de visibilidad:", error);
  }
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
      <p>Buenos días ${esc(datos.nombreClinica)},</p>
      <p>
        Queríamos darte las gracias personalmente por seguir invirtiendo en que más
        pacientes os encuentren. Tu centro ya tiene el modo
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
  revalidatePath("/centros");
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
  await requireAdmin();
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

  let errorUpdate: { message: string } | null = null;
  if (tipo === "premium") {
    ({ error: errorUpdate } = await supabase
      .from("clinics")
      .update({ ...camposBase, plan: "premium", plan_solicitado: null })
      .eq("id", clinicId));
  } else {
    // Plazas limitadas: 8 generales en total y 8 por provincia. Si ya
    // están todas ocupadas, no se activa (ver lib/visibilidad/destacados.ts).
    const { data: actual } = await supabase
      .from("clinics")
      .select("provincia, destacado, destacado_provincia")
      .eq("id", clinicId)
      .maybeSingle();
    const yaActivo = actual
      ? tipo === "destacado"
        ? actual.destacado
        : actual.destacado_provincia
      : false;
    if (!yaActivo) {
      const plazas = await plazasDestacado(supabase, tipo, actual?.provincia ?? null);
      if (plazas.libres === 0) {
        throw new Error(
          `No quedan plazas de "${TIPO_LABEL[tipo]}"${
            tipo === "destacado_provincia" ? ` en ${actual?.provincia ?? "esta provincia"}` : ""
          }: ${plazas.ocupadas} de ${plazas.total} ocupadas.`,
        );
      }
    }
    ({ error: errorUpdate } = await supabase
      .from("clinics")
      .update({ ...camposBase, ...camposDestacado(tipo, { activo: true, solicitado: false }) })
      .eq("id", clinicId));
  }
  // Antes no se comprobaba el error de este update: si fallaba (p. ej.
  // una conexión cortada a media petición) la activación se daba por
  // buena en el cliente sin haber cambiado nada en la BBDD, y al
  // intentar activar otra vez parecía que "no dejaba" — sin ningún
  // aviso de qué había pasado.
  if (errorUpdate) {
    throw new Error(`No se ha podido activar "${TIPO_LABEL[tipo]}": ${errorUpdate.message}`);
  }

  await registrarLogVisibilidad(supabase, {
    clinicId,
    tipo,
    accion: "alta",
    mesesDuracion,
    expiraEn: expiraIso,
    motivo: "aprobado_admin",
  });

  revalidarTodo();

  // El email de aviso se manda en segundo plano, después de responder:
  // la llamada a Resend podía tardar varios segundos y antes se
  // esperaba aquí dentro, haciendo que activar/desactivar se sintiera
  // lentísimo aunque el cambio real en la BBDD ya estuviera hecho.
  after(async () => {
    try {
      const { data: clinic } = await supabase
        .from("clinics")
        .select("nombre, email")
        .eq("id", clinicId)
        .maybeSingle();
      if (!clinic?.email) return;

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
    } catch (e) {
      // Un fallo de envío no debe impedir que la activación quede
      // guardada — el admin ya ve el estado activo en el panel aunque
      // el aviso por email no llegara.
      console.error("Error al enviar email de activación de visibilidad:", e);
    }
  });
}

/** Desactiva directamente y limpia sus fechas. */
export async function desactivarVisibilidad(
  clinicId: string,
  tipo: TipoVisibilidad,
) {
  await requireAdmin();
  const supabase = createAdminClient();

  const fechas = await leerFechas(supabase, clinicId);
  delete fechas[tipo];
  const camposBase = { visibilidad_fechas: fechas };

  let errorUpdate: { message: string } | null = null;
  if (tipo === "premium") {
    ({ error: errorUpdate } = await supabase
      .from("clinics")
      .update({ ...camposBase, plan: "basico", plan_solicitado: null })
      .eq("id", clinicId));
  } else {
    ({ error: errorUpdate } = await supabase
      .from("clinics")
      .update({ ...camposBase, ...camposDestacado(tipo, { activo: false, solicitado: false }) })
      .eq("id", clinicId));
  }
  if (errorUpdate) {
    throw new Error(`No se ha podido desactivar "${TIPO_LABEL[tipo]}": ${errorUpdate.message}`);
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
  await requireAdmin();
  const supabase = createAdminClient();

  let errorUpdate: { message: string } | null = null;
  if (tipo === "premium") {
    ({ error: errorUpdate } = await supabase
      .from("clinics")
      .update({ plan_solicitado: null })
      .eq("id", clinicId));
  } else {
    ({ error: errorUpdate } = await supabase
      .from("clinics")
      .update(camposDestacado(tipo, { solicitado: false }))
      .eq("id", clinicId));
  }
  if (errorUpdate) {
    throw new Error(`No se ha podido rechazar "${TIPO_LABEL[tipo]}": ${errorUpdate.message}`);
  }

  revalidarTodo();
}
