import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { urlFirmadaFoto } from "@/lib/supabase/estudios-storage";
import { registrarEventoLead } from "@/lib/leads/lead-events";
import { contactoLiberado, type EstadoLead } from "@/lib/leads/estados-lead";
import { PropuestaForm } from "@/components/leads/propuesta-form";
import { CitaSeguimiento } from "@/components/leads/cita-seguimiento";
import { leerOpcionesCita } from "@/lib/leads/opciones-cita";
import { FotoAmpliable } from "@/components/leads/foto-ampliable";
import {
  PROGRESION_LABEL,
  CUANDO_LABEL,
  DONDE_LABEL,
  PRIORIDAD_LABEL,
  FUMADOR_LABEL,
  CONDICIONES_MEDICAS_LABEL,
  SINTOMAS_CUERO_CABELLUDO_LABEL,
  TRATAMIENTOS_USADOS_LABEL,
  SEXO_LABEL,
  labelTipoPerdida,
  labelPresupuesto,
  etiqueta,
} from "@/lib/solicitud-labels";

/**
 * Contenido de la ficha de un lead (sin cabecera propia): lo comparten
 * la página independiente (/leads/[token], para el enlace del email y
 * la recarga completa) y el modal que se abre desde el listado de
 * solicitudes del panel, para no perder la navegación del panel.
 */
export async function LeadDetalle({
  token,
  embebido = false,
}: {
  token: string;
  /** Desplegado dentro del listado del panel: sin saludo de cabecera. */
  embebido?: boolean;
}) {
  const supabase = createAdminClient();

  const { data: lead } = await supabase
    .from("leads_clinica")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!lead) {
    notFound();
  }

  const estado = lead.estado as EstadoLead;
  const puedeResponder = estado === "enviado" || estado === "visto" || estado === "propuesta_enviada";
  // El nombre/teléfono/email no se liberan hasta que el paciente elige
  // esta clínica (Fase 5) — el resto del perfil se ve completo desde
  // que llega el lead.
  const contactoOk = contactoLiberado(estado);

  const [{ data: solicitud }, { data: clinica }, { data: propuestaExistente }] =
    await Promise.all([
      supabase
        .from("solicitudes_presupuesto")
        .select("*")
        .eq("id", lead.solicitud_id)
        .maybeSingle(),
      supabase
        .from("clinics")
        .select("nombre, logo_url")
        .eq("id", lead.clinic_id)
        .maybeSingle(),
      supabase
        .from("propuestas_clinica")
        .select("*")
        .eq("lead_id", lead.id)
        .maybeSingle(),
    ]);

  if (!solicitud) {
    notFound();
  }

  let resumenIA: string | null = null;
  let hayValoracion = false;
  let fotoUrls: string[] = [];
  if (solicitud.estudio_id) {
    const { data: estudio } = await supabase
      .from("estudios_capilares")
      .select(
        "resultado_texto, estado, informe, foto_frontal, foto_donante, foto_coronilla, foto_perfil_derecho, foto_perfil_izquierdo, fotos_adicionales",
      )
      .eq("id", solicitud.estudio_id)
      .maybeSingle();
    resumenIA = estudio?.resultado_texto ?? null;
    hayValoracion = estudio?.estado === "listo" && estudio.informe != null;

    if (estudio) {
      const rutas = [
        estudio.foto_frontal,
        estudio.foto_donante,
        estudio.foto_coronilla,
        estudio.foto_perfil_derecho,
        estudio.foto_perfil_izquierdo,
        ...estudio.fotos_adicionales,
      ].filter((r): r is string => Boolean(r));

      const urls = await Promise.all(rutas.map((r) => urlFirmadaFoto(supabase, r)));
      fotoUrls = urls.filter((u): u is string => Boolean(u));
    }
  }

  const { data: perfilMedico } = await supabase
    .from("profiles")
    .select("sexo, tipo_perdida_cabello")
    .eq("id", solicitud.user_id)
    .maybeSingle();

  let paciente: {
    nombre: string | null;
    apellidos: string | null;
    telefono: string | null;
    email: string | null;
  } | null = null;
  if (contactoOk) {
    const { data } = await supabase
      .from("profiles")
      .select("nombre, apellidos, telefono, email")
      .eq("id", solicitud.user_id)
      .maybeSingle();
    paciente = data ?? null;
  }

  if (lead.estado === "enviado") {
    await supabase
      .from("leads_clinica")
      .update({ estado: "visto", visto_en: new Date().toISOString() })
      .eq("id", lead.id);

    await registrarEventoLead(supabase, {
      event: "lead_opened",
      solicitudId: lead.solicitud_id,
      leadId: lead.id,
      clinicId: lead.clinic_id,
    });
  }

  const datos: { k: string; v: string }[] = [];
  const add = (k: string, v: string | null | undefined) => v && datos.push({ k, v });
  add("Sexo", perfilMedico?.sexo ? etiqueta(SEXO_LABEL, perfilMedico.sexo) : null);
  add(
    "Tipo de pérdida de cabello",
    perfilMedico?.sexo && perfilMedico.tipo_perdida_cabello
      ? labelTipoPerdida(perfilMedico.sexo, perfilMedico.tipo_perdida_cabello)
      : null,
  );
  add("Ciudad", solicitud.ciudad);
  add("Código postal", solicitud.codigo_postal);
  add("Progresión de la pérdida", etiqueta(PROGRESION_LABEL, solicitud.progresion_perdida));
  add("Antecedentes familiares", solicitud.antecedentes_familiares);
  add("Medicación actual", solicitud.medicacion_actual);
  if (solicitud.sintomas_cuero_cabelludo.length > 0)
    add(
      "Síntomas en el cuero cabelludo",
      solicitud.sintomas_cuero_cabelludo.map((s) => SINTOMAS_CUERO_CABELLUDO_LABEL[s] ?? s).join(", "),
    );
  if (solicitud.tratamientos_usados.length > 0)
    add(
      "Tratamientos ya probados",
      solicitud.tratamientos_usados.map((t) => TRATAMIENTOS_USADOS_LABEL[t] ?? t).join(", ") +
        (solicitud.tratamientos_usados_detalle ? ` — ${solicitud.tratamientos_usados_detalle}` : ""),
    );
  add("Cambios de salud recientes", solicitud.cambios_salud_recientes);
  if (solicitud.tratamientos_interes.length > 0)
    add("Tratamientos de interés", solicitud.tratamientos_interes.join(", "));
  if (solicitud.dejar_decidir_medico) add("Tratamiento", "Deja que el médico decida la técnica");
  add("Cuándo quiere empezar", etiqueta(CUANDO_LABEL, solicitud.cuando_tratamiento));
  add("Dónde", etiqueta(DONDE_LABEL, solicitud.donde_tratamiento));
  if (solicitud.presupuesto_rango)
    add("Presupuesto aproximado", labelPresupuesto(solicitud.presupuesto_rango));
  add("Lo más importante para el paciente", etiqueta(PRIORIDAD_LABEL, solicitud.prioridad_decision));
  add("Alergias", solicitud.alergias);
  if (solicitud.condiciones_medicas.length > 0)
    add(
      "Condiciones médicas",
      solicitud.condiciones_medicas.map((c) => CONDICIONES_MEDICAS_LABEL[c] ?? c).join(", "),
    );
  add("Cirugías previas", solicitud.cirugias_previas);
  add("Fumador", etiqueta(FUMADOR_LABEL, solicitud.fumador));

  return (
    <>
      {!embebido && (
        <div className="mb-6">
          <p className="text-sm uppercase tracking-wide text-ink-soft">Solicitud de presupuesto</p>
          <h1 className="mt-2 font-display text-2xl text-teal-dark">
            {clinica?.nombre ? `Hola, ${clinica.nombre}` : "Nueva solicitud"}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Un paciente de Growwly ha pedido presupuesto y tu clínica encaja con lo que busca.
          </p>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* ===== IZQUIERDA · EL CASO ===== */}
        <div className="flex min-w-0 flex-col gap-4">
          <h3 className="font-display text-lg font-bold text-teal-dark">El caso del paciente</h3>

          {resumenIA && (
            <div className="rounded-xl bg-sage p-4 text-sm text-sage-ink">
              <p className="font-semibold">Impresión orientativa</p>
              <p className="mt-1 leading-relaxed">{resumenIA}</p>
            </div>
          )}

          {hayValoracion && (
            <Link
              href={`/leads/${token}/valoracion`}
              className="press self-start rounded-full bg-yellow px-5 py-2.5 font-display text-sm font-bold text-teal-dark shadow-md shadow-yellow/30 hover:opacity-90"
            >
              Ver la valoración que vio el paciente →
            </Link>
          )}

          {fotoUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {fotoUrls.map((url) => (
                <div
                  key={url}
                  className="relative aspect-square overflow-hidden rounded-lg border border-line bg-white"
                >
                  <FotoAmpliable src={url} alt="Foto del paciente" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-line bg-white">
            <p className="border-b border-line px-4 py-3 text-sm font-semibold text-teal-dark">
              Lo que ha rellenado en el formulario
            </p>
            <dl className="divide-y divide-line text-sm">
              {datos.map((d) => (
                <Row key={d.k} label={d.k} value={d.v} />
              ))}
            </dl>
          </div>
        </div>

        {/* ===== DERECHA · RESPONDER ===== */}
        <div className="flex min-w-0 flex-col gap-4 [&>*]:mt-0">
          <h3 className="font-display text-lg font-bold text-teal-dark">Responder al paciente</h3>

          {contactoOk && paciente && (
            <div className="rounded-xl bg-sage p-5">
              <p className="font-display text-lg text-sage-ink">Datos de contacto</p>
              <dl className="mt-2 divide-y divide-sage-ink/10 text-sm">
                {paciente.nombre && (
                  <Row label="Nombre" value={`${paciente.nombre} ${paciente.apellidos ?? ""}`.trim()} />
                )}
                {paciente.telefono && <Row label="Teléfono" value={paciente.telefono} />}
                {paciente.email && <Row label="Email" value={paciente.email} />}
              </dl>
            </div>
          )}

          {!contactoOk && (
            <div className="rounded-xl bg-sage/60 p-4 text-sm text-sage-ink">
              El paciente todavía no ha elegido clínica. Si te elige tras ver tu propuesta, verás aquí su
              nombre, teléfono y email.
            </div>
          )}

          {puedeResponder && (
            <PropuestaForm
              token={token}
              tratamientoSugerido={
                solicitud.dejar_decidir_medico ? "" : solicitud.tratamientos_interes.join(", ")
              }
              propuestaExistente={propuestaExistente ?? null}
            />
          )}

          <CitaSeguimiento
            token={token}
            estado={estado}
            fechaCita={lead.fecha_cita}
            opcionesCita={leerOpcionesCita(lead.opciones_cita)}
            otrasFechasPedidas={Boolean(lead.otras_fechas_pedidas_en)}
            feedbackPuntuacion={lead.feedback_puntuacion}
            feedbackComentario={lead.feedback_comentario}
          />
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
