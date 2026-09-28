import Link from "next/link";
import Image from "next/image";
import { ClipboardList, Mail } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { SelloMatchScore } from "@/components/cuenta/sello-match-score";
import { PropuestaRecibidaCard } from "@/components/cuenta/propuesta-recibida-card";
import { FeedbackForm } from "@/components/cuenta/feedback-form";
import { contactoLiberado, type EstadoLead } from "@/lib/leads/estados-lead";
import { BorrarSolicitudButton } from "./borrar-solicitud-button";
import { CabeceraCuenta } from "@/components/cuenta/cabecera-cuenta";
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
  const mejorMatchScore =
    matchScores.length > 0 ? Math.max(...matchScores) : null;

  // El paciente solo ve datos de clínica en dos casos: propuestas ya
  // recibidas (para poder elegir) y la clínica que ya eligió (Fase 5)
  // — el resto de leads (enviado/visto/desbloqueado/no_seleccionado…)
  // no se muestran uno a uno, solo cuentan para el sello de arriba.
  const leadSeleccionado = todosLeads.find((l) =>
    contactoLiberado(l.estado as EstadoLead),
  );
  const leadsConPropuesta = todosLeads.filter(
    (l) => l.estado === "propuesta_enviada",
  );

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

  const clinicaPorId = new Map(
    (clinicasRelevantes ?? []).map((c) => [c.id, c]),
  );
  const propuestaPorLeadId = new Map(
    (propuestasRelevantes ?? []).map((p) => [p.lead_id, p]),
  );

  const clinicaSeleccionada = leadSeleccionado
    ? clinicaPorId.get(leadSeleccionado.clinic_id)
    : null;
  const propuestaSeleccionada = leadSeleccionado
    ? propuestaPorLeadId.get(leadSeleccionado.id)
    : null;

  const numPropuestas = leadsConPropuesta.length;
  const pasos = [
    { label: "Solicitud enviada", hecho: true },
    {
      label: "Propuestas recibidas",
      hecho: numPropuestas > 0 || Boolean(leadSeleccionado),
    },
    { label: "Clínica elegida", hecho: Boolean(leadSeleccionado) },
    {
      label: "Cita",
      hecho:
        Boolean(leadSeleccionado?.fecha_cita) ||
        ["cita_realizada", "convertido", "no_convertido"].includes(
          leadSeleccionado?.estado ?? "",
        ),
    },
  ];
  const pasoActual = pasos.findIndex((p) => !p.hecho);

  const titulo = clinicaSeleccionada
    ? "Has elegido clínica"
    : numPropuestas > 0
      ? `Tienes ${numPropuestas} ${numPropuestas === 1 ? "propuesta" : "propuestas"}`
      : "¡Solicitud enviada!";
  const texto = clinicaSeleccionada
    ? "La clínica ya tiene tus datos de contacto y se pondrá en contacto contigo."
    : numPropuestas > 0
      ? "Revisa cada propuesta y elige la clínica con la que quieras seguir. Solo compartiremos tu contacto con la que elijas."
      : solicitud.clinicas_notificadas === null
        ? "La estamos haciendo llegar a las clínicas que mejor encajen con lo que buscas."
        : solicitud.clinicas_notificadas > 0
          ? "Te avisaremos por email en cuanto alguna clínica te envíe su propuesta."
          : "No hemos encontrado clínicas que encajen exactamente con esa ciudad o técnica todavía. Puedes retirar esta solicitud y probar ampliando tus preferencias.";

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <CabeceraCuenta userId={user.id} email={user.email ?? null} />

        <div className="mt-8 flex items-center justify-between gap-4">
          <Link
            href="/cuenta"
            className="text-sm font-medium text-cyan hover:text-cyan-dark"
          >
            ← Volver a mi cuenta
          </Link>
          <BorrarSolicitudButton id={solicitud.id} />
        </div>

        <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ===== Estado y propuestas ===== */}
          <div className="flex min-w-0 flex-col gap-6">
            <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex max-w-xl flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal">
                    Solicitud del{" "}
                    {new Date(solicitud.created_at).toLocaleDateString("es-ES")}
                  </p>
                  <h1 className="font-display text-3xl font-extrabold text-teal-dark">
                    {titulo}
                  </h1>
                  <p className="text-base leading-relaxed text-ink-soft">
                    {texto}
                  </p>
                </div>
                {solicitud.clinicas_notificadas != null &&
                  solicitud.clinicas_notificadas > 0 &&
                  mejorMatchScore != null && (
                    <div className="md:max-w-sm">
                      <SelloMatchScore
                        matchScore={mejorMatchScore}
                        numeroClinicas={solicitud.clinicas_notificadas}
                      />
                    </div>
                  )}
              </div>

              <ol className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {pasos.map((p, i) => {
                  const actual = i === pasoActual;
                  return (
                    <li key={p.label} className="flex flex-col gap-2">
                      <span
                        className={`h-1.5 rounded-full ${
                          p.hecho ? "bg-teal" : actual ? "bg-yellow" : "bg-line"
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          p.hecho
                            ? "text-teal-dark"
                            : actual
                              ? "text-[#8a5a00]"
                              : "text-ink-soft"
                        }`}
                      >
                        {i + 1}. {p.label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {solicitud.notificacion_error && (
                <p className="mt-4 rounded-lg bg-paper-dim px-3 py-2 text-xs text-ink-soft">
                  Detalle técnico: {solicitud.notificacion_error}
                </p>
              )}
            </section>

            {clinicaSeleccionada && (
              <section className="rounded-3xl border border-teal-dark/20 bg-teal-dark/5 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  {clinicaSeleccionada.logo_url ? (
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-sage">
                      <Image
                        src={clinicaSeleccionada.logo_url}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-bold text-sage-ink">
                      {clinicaSeleccionada.nombre.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-dark">
                      Has elegido esta clínica
                    </p>
                    <p className="font-display text-xl text-teal-dark">
                      {clinicaSeleccionada.nombre}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-teal-dark/80">
                  Le hemos compartido tu nombre, teléfono y email para que pueda
                  contactarte. El resto de clínicas ya no tienen acceso a tu
                  solicitud.
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {propuestaSeleccionada?.mensaje && (
                    <p className="rounded-lg bg-white/70 p-3 text-sm text-ink">
                      {propuestaSeleccionada.mensaje}
                    </p>
                  )}
                  {leadSeleccionado?.fecha_cita && (
                    <p className="rounded-lg bg-white/70 p-3 text-sm text-ink">
                      <span className="font-medium">Tu cita: </span>
                      {new Date(leadSeleccionado.fecha_cita).toLocaleString(
                        "es-ES",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  )}
                </div>
              </section>
            )}

            {leadSeleccionado &&
              ["cita_realizada", "convertido", "no_convertido"].includes(
                leadSeleccionado.estado,
              ) &&
              (leadSeleccionado.feedback_recibido_en ? (
                <p className="text-sm text-ink-soft">
                  Gracias por tu valoración — ya se la hemos hecho llegar a la
                  clínica.
                </p>
              ) : (
                <FeedbackForm
                  solicitudId={solicitud.id}
                  leadId={leadSeleccionado.id}
                />
              ))}

            {!clinicaSeleccionada && numPropuestas > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="font-display text-2xl font-extrabold text-teal-dark">
                  Propuestas recibidas ({numPropuestas})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
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
              </section>
            )}

            {!clinicaSeleccionada &&
              numPropuestas === 0 &&
              (solicitud.clinicas_notificadas ?? 0) > 0 && (
                <section className="flex items-center gap-4 rounded-3xl border border-dashed border-line bg-white/60 p-6 sm:p-8">
                  <Mail className="h-8 w-8 shrink-0 text-teal" aria-hidden />
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Aquí aparecerán las propuestas de las clínicas, una al lado
                    de la otra, para que puedas compararlas. Te avisaremos por
                    email en cuanto llegue la primera.
                  </p>
                </section>
              )}
          </div>

          {/* ===== Resumen ===== */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <h2 className="flex items-center gap-2 font-display text-xl text-teal-dark">
              <ClipboardList className="h-5 w-5 text-teal" aria-hidden />
              Resumen de tu solicitud
            </h2>
            <dl className="divide-y divide-line rounded-2xl border border-line bg-white text-sm">
              {profile?.sexo && (
                <Row label="Sexo" value={etiqueta(SEXO_LABEL, profile.sexo)!} />
              )}
              {profile?.tipo_perdida_cabello && (
                <Row
                  label="Tipo de pérdida de cabello"
                  value={labelTipoPerdida(
                    profile.sexo,
                    profile.tipo_perdida_cabello,
                  )!}
                />
              )}
              {solicitud.ciudad && (
                <Row label="Ciudad" value={solicitud.ciudad} />
              )}
              {solicitud.progresion_perdida && (
                <Row
                  label="Progresión de la pérdida"
                  value={etiqueta(
                    PROGRESION_LABEL,
                    solicitud.progresion_perdida,
                  )!}
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
                  value={etiqueta(
                    PRIORIDAD_LABEL,
                    solicitud.prioridad_decision,
                  )!}
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
                <Row
                  label="Cirugías previas"
                  value={solicitud.cirugias_previas}
                />
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
          </aside>
        </div>
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
