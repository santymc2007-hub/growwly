import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { SelloMatchScore } from "@/components/cuenta/sello-match-score";
import { PropuestaRecibidaCard } from "@/components/cuenta/propuesta-recibida-card";
import { FeedbackForm } from "@/components/cuenta/feedback-form";
import { contactoLiberado, type EstadoLead } from "@/lib/leads/estados-lead";
import { BorrarSolicitudButton } from "./borrar-solicitud-button";
import {
  PROGRESION_LABEL,
  CUANDO_LABEL,
  DONDE_LABEL,
  PRIORIDAD_LABEL,
  FUMADOR_LABEL,
  CONDICIONES_MEDICAS_LABEL,
  SEXO_LABEL,
  labelTipoPerdida,
  labelPresupuesto,
  etiqueta,
} from "@/lib/solicitud-labels";

type Params = { id: string };

export default async function SolicitudDetallePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const [{ data: solicitud }, { data: profile }] = await Promise.all([
    supabase
      .from("solicitudes_presupuesto")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("sexo, tipo_perdida_cabello")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!solicitud) {
    notFound();
  }

  // RLS de "leads_clinica" es solo para el backend — hace falta el
  // cliente admin incluso para que el propio paciente vea cuántas
  // clínicas encajaron con su solicitud.
  const admin = createAdminClient();
  const { data: leads } = await admin
    .from("leads_clinica")
    .select(
      "id, estado, clinic_id, match_score, fecha_cita, feedback_puntuacion, feedback_recibido_en",
    )
    .eq("solicitud_id", solicitud.id);

  const todosLeads = leads ?? [];
  const matchScores = todosLeads
    .map((l) => l.match_score)
    .filter((m): m is number => m != null);
  const mejorMatchScore = matchScores.length > 0 ? Math.max(...matchScores) : null;

  // El paciente solo ve datos de clínica en dos casos: propuestas ya
  // recibidas (para poder elegir) y la clínica que ya eligió (Fase 5)
  // — el resto de leads (enviado/visto/desbloqueado/no_seleccionado…)
  // no se muestran uno a uno, solo cuentan para el sello de arriba.
  const leadSeleccionado = todosLeads.find((l) => contactoLiberado(l.estado as EstadoLead));
  const leadsConPropuesta = todosLeads.filter((l) => l.estado === "propuesta_enviada");

  const leadsRelevantes = leadSeleccionado
    ? [leadSeleccionado]
    : leadsConPropuesta;

  const [{ data: clinicasRelevantes }, { data: propuestasRelevantes }] =
    leadsRelevantes.length > 0
      ? await Promise.all([
          admin
            .from("clinics")
            .select("id, nombre, logo_url")
            .in(
              "id",
              leadsRelevantes.map((l) => l.clinic_id),
            ),
          admin
            .from("propuestas_clinica")
            .select("*")
            .in(
              "lead_id",
              leadsRelevantes.map((l) => l.id),
            ),
        ])
      : [{ data: [] }, { data: [] }];

  const clinicaPorId = new Map((clinicasRelevantes ?? []).map((c) => [c.id, c]));
  const propuestaPorLeadId = new Map(
    (propuestasRelevantes ?? []).map((p) => [p.lead_id, p]),
  );

  const clinicaSeleccionada = leadSeleccionado
    ? clinicaPorId.get(leadSeleccionado.clinic_id)
    : null;
  const propuestaSeleccionada = leadSeleccionado
    ? propuestaPorLeadId.get(leadSeleccionado.id)
    : null;

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-6 py-12">
        <Link
          href="/cuenta"
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          ← Volver a mi cuenta
        </Link>

        <div className="mt-4 rounded-xl bg-sage p-5">
          <p className="font-display text-lg text-sage-ink">
            ¡Solicitud enviada!
          </p>
          <p className="mt-1 text-sm text-sage-ink">
            {solicitud.clinicas_notificadas === null
              ? "La estamos haciendo llegar a las clínicas que mejor encajen con lo que buscas."
              : solicitud.clinicas_notificadas > 0
                ? "Te avisaremos cuando tengas propuestas."
                : "No hemos encontrado clínicas que encajen exactamente con esa ciudad o técnica todavía — puedes revisar tu solicitud o ampliar tus preferencias."}
          </p>
          {solicitud.clinicas_notificadas != null &&
            solicitud.clinicas_notificadas > 0 &&
            mejorMatchScore != null && (
              <SelloMatchScore
                matchScore={mejorMatchScore}
                numeroClinicas={solicitud.clinicas_notificadas}
              />
            )}
          {solicitud.notificacion_error && (
            <p className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-xs text-sage-ink">
              Detalle técnico: {solicitud.notificacion_error}
            </p>
          )}
        </div>

        {clinicaSeleccionada && (
          <div className="mt-6 rounded-xl border border-teal-dark/20 bg-teal-dark/5 p-5">
            <div className="flex items-center gap-3">
              {clinicaSeleccionada.logo_url ? (
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-sage">
                  <Image
                    src={clinicaSeleccionada.logo_url}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-bold text-sage-ink">
                  {clinicaSeleccionada.nombre.charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-dark">
                  Has elegido esta clínica
                </p>
                <p className="font-display text-lg text-teal-dark">
                  {clinicaSeleccionada.nombre}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-teal-dark/80">
              Le hemos compartido tu nombre, teléfono y email para que pueda
              contactarte. El resto de clínicas ya no tienen acceso a tu
              solicitud.
            </p>
            {propuestaSeleccionada?.mensaje && (
              <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-ink">
                {propuestaSeleccionada.mensaje}
              </p>
            )}
            {leadSeleccionado?.fecha_cita && (
              <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-ink">
                <span className="font-medium">Tu cita: </span>
                {new Date(leadSeleccionado.fecha_cita).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        )}

        {leadSeleccionado &&
          ["cita_realizada", "convertido", "no_convertido"].includes(leadSeleccionado.estado) &&
          (leadSeleccionado.feedback_recibido_en ? (
            <p className="mt-4 text-sm text-ink-soft">
              Gracias por tu valoración — ya se la hemos hecho llegar a la clínica.
            </p>
          ) : (
            <FeedbackForm solicitudId={solicitud.id} leadId={leadSeleccionado.id} />
          ))}

        {!clinicaSeleccionada && leadsConPropuesta.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-lg text-teal-dark">
              Propuestas recibidas ({leadsConPropuesta.length})
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Revisa cada propuesta y elige la clínica con la que quieras
              seguir adelante — solo compartiremos tu contacto con la que
              elijas.
            </p>
            <div className="mt-4 flex flex-col gap-4">
              {leadsConPropuesta.map((lead) => {
                const clinica = clinicaPorId.get(lead.clinic_id);
                const propuesta = propuestaPorLeadId.get(lead.id);
                if (!clinica || !propuesta) return null;
                return (
                  <PropuestaRecibidaCard
                    key={lead.id}
                    solicitudId={solicitud.id}
                    leadId={lead.id}
                    nombreClinica={clinica.nombre}
                    logoUrl={clinica.logo_url}
                    propuesta={propuesta}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h1 className="font-display text-xl text-teal-dark">
            Resumen de tu solicitud
          </h1>
          <BorrarSolicitudButton id={solicitud.id} />
        </div>

        <dl className="mt-4 divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {profile?.sexo && (
            <Row label="Sexo" value={etiqueta(SEXO_LABEL, profile.sexo)!} />
          )}
          {profile?.tipo_perdida_cabello && (
            <Row
              label="Tipo de pérdida de cabello"
              value={labelTipoPerdida(profile.sexo, profile.tipo_perdida_cabello)!}
            />
          )}
          {solicitud.ciudad && <Row label="Ciudad" value={solicitud.ciudad} />}
          {solicitud.progresion_perdida && (
            <Row
              label="Progresión de la pérdida"
              value={etiqueta(PROGRESION_LABEL, solicitud.progresion_perdida)!}
            />
          )}
          {solicitud.tratamientos_interes.length > 0 && (
            <Row
              label="Tratamientos de interés"
              value={solicitud.tratamientos_interes.join(", ")}
            />
          )}
          {solicitud.dejar_decidir_medico && (
            <Row
              label="Tratamiento"
              value="Deja que el médico decida la mejor técnica"
            />
          )}
          {solicitud.cuando_tratamiento && (
            <Row
              label="Cuándo"
              value={etiqueta(CUANDO_LABEL, solicitud.cuando_tratamiento)!}
            />
          )}
          {solicitud.donde_tratamiento && (
            <Row
              label="Dónde"
              value={etiqueta(DONDE_LABEL, solicitud.donde_tratamiento)!}
            />
          )}
          {solicitud.presupuesto_rango && (
            <Row
              label="Presupuesto"
              value={labelPresupuesto(solicitud.presupuesto_rango)}
            />
          )}
          {solicitud.prioridad_decision && (
            <Row
              label="Lo más importante para usted"
              value={etiqueta(PRIORIDAD_LABEL, solicitud.prioridad_decision)!}
            />
          )}
          {solicitud.alergias && (
            <Row label="Alergias" value={solicitud.alergias} />
          )}
          {solicitud.condiciones_medicas.length > 0 && (
            <Row
              label="Condiciones médicas"
              value={solicitud.condiciones_medicas
                .map((c) => CONDICIONES_MEDICAS_LABEL[c] ?? c)
                .join(", ")}
            />
          )}
          {solicitud.cirugias_previas && (
            <Row label="Cirugías previas" value={solicitud.cirugias_previas} />
          )}
          {solicitud.fumador && (
            <Row
              label="Fumador"
              value={etiqueta(FUMADOR_LABEL, solicitud.fumador)!}
            />
          )}
          <Row
            label="Fotos vinculadas"
            value={solicitud.estudio_id ? "Sí" : "No"}
          />
        </dl>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
