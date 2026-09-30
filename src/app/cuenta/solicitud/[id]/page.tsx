import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { SelloScore } from "@/components/ui/sello-score";
import { FeedbackForm } from "@/components/cuenta/feedback-form";
import { CabeceraCuenta } from "@/components/cuenta/cabecera-cuenta";
import {
  ClinicasSolicitud,
  type FilaClinica,
  type OfertaClinica,
  type TipoFilaClinica,
} from "@/components/cuenta/presupuesto/clinicas-solicitud";
import { ElegirFecha } from "@/components/cuenta/presupuesto/elegir-fecha";
import { contactoLiberado, type EstadoLead } from "@/lib/leads/estados-lead";
import {
  TIPO_CONSULTA_LABEL,
  etiquetaIncluye,
  formatearPrecioPropuesta,
} from "@/lib/leads/propuesta-options";
import { fechaCitaLarga, leerOpcionesCita } from "@/lib/leads/opciones-cita";
import {
  CUANDO_LABEL,
  DONDE_LABEL,
  labelPresupuesto,
  etiqueta,
  SEXO_LABEL,
  labelTipoPerdida,
  PROGRESION_LABEL,
  FUMADOR_LABEL,
  CONDICIONES_MEDICAS_LABEL,
  SINTOMAS_CUERO_CABELLUDO_LABEL,
  TRATAMIENTOS_USADOS_LABEL,
  PRIORIDAD_LABEL,
} from "@/lib/solicitud-labels";
import type { Database } from "@/lib/supabase/database.types";
import { BorrarSolicitudButton } from "./borrar-solicitud-button";

type Params = { id: string };
type Propuesta = Database["public"]["Tables"]["propuestas_clinica"]["Row"];
type Clinica = {
  id: string;
  nombre: string;
  logo_url: string | null;
  ciudad: string | null;
  zona: string | null;
  direccion: string | null;
  rating_google: number | null;
};

const ESTADOS_CON_CITA_HECHA: EstadoLead[] = ["cita_realizada", "convertido", "no_convertido"];

function fechaCorta(fecha: string) {
  return new Date(fecha)
    .toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" })
    .replace(".", "");
}

function detalleClinica(c: Clinica | undefined) {
  if (!c) return "";
  const lugar = c.ciudad ?? c.zona ?? "";
  const nota =
    c.rating_google != null
      ? `★ ${Number(c.rating_google).toFixed(1).replace(".", ",")} Opiniones Google`
      : "";
  return [lugar, nota].filter(Boolean).join(" · ");
}

function oferta(p: Propuesta): OfertaClinica {
  const filas: { k: string; v: string }[] = [];
  if (p.tipo_consulta)
    filas.push({ k: "Primera cita", v: TIPO_CONSULTA_LABEL[p.tipo_consulta] ?? p.tipo_consulta });
  if (p.disponibilidad) filas.push({ k: "Disponibilidad", v: p.disponibilidad });
  if (p.valido_hasta)
    filas.push({
      k: "Válida hasta",
      v: new Date(p.valido_hasta).toLocaleDateString("es-ES", { day: "numeric", month: "long" }),
    });
  const tipoPrecio =
    p.tipo_precio === "cerrado"
      ? "Precio cerrado"
      : p.tipo_precio === "rango"
        ? "Rango estimado"
        : null;
  return {
    tratamiento: p.tratamiento,
    precio: formatearPrecioPropuesta(p),
    tipoPrecio,
    filas,
    incluye: p.incluye.map(etiquetaIncluye),
    mensaje: p.mensaje,
  };
}

function calendarioGoogle(titulo: string, fecha: string, lugar: string | null) {
  const inicio = new Date(fecha);
  const fin = new Date(inicio.getTime() + 30 * 60 * 1000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    dates: `${f(inicio)}/${f(fin)}`,
    ...(lugar ? { location: lugar } : {}),
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export default async function SolicitudDetallePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/cuenta/login");

  const [{ data: solicitud }, { data: profile }] = await Promise.all([
    supabase
      .from("solicitudes_presupuesto")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);
  if (!solicitud) notFound();

  // RLS de leads_clinica/propuestas/clinics-internas es solo para el
  // backend: el paciente ve lo suyo a través del cliente admin.
  const admin = createAdminClient();
  const { data: leadsData } = await admin
    .from("leads_clinica")
    .select(
      "id, estado, clinic_id, match_score, enviado_en, propuesta_enviada_en, propuesta_vista_en, descartado_por_paciente_en, seleccionado_en, fecha_cita, opciones_cita, otras_fechas_pedidas_en, feedback_recibido_en",
    )
    .eq("solicitud_id", solicitud.id)
    .order("enviado_en", { ascending: true });

  const leads = (leadsData ?? []).filter((l) => l.estado !== "cancelado");

  const leadElegido = leads.find((l) => contactoLiberado(l.estado as EstadoLead)) ?? null;
  const conPropuesta = leads.filter((l) => l.propuesta_enviada_en);

  const idsClinicas = Array.from(
    new Set([...conPropuesta.map((l) => l.clinic_id), ...(leadElegido ? [leadElegido.clinic_id] : [])]),
  );
  const idsLeadsPropuesta = Array.from(
    new Set([...conPropuesta.map((l) => l.id), ...(leadElegido ? [leadElegido.id] : [])]),
  );

  const [{ data: clinicasData }, { data: propuestasData }] = await Promise.all([
    idsClinicas.length > 0
      ? admin
          .from("clinics")
          .select("id, nombre, logo_url, ciudad, zona, direccion, rating_google")
          .in("id", idsClinicas)
      : Promise.resolve({ data: [] as Clinica[] }),
    idsLeadsPropuesta.length > 0
      ? admin.from("propuestas_clinica").select("*").in("lead_id", idsLeadsPropuesta)
      : Promise.resolve({ data: [] as Propuesta[] }),
  ]);
  const clinicaPorId = new Map((clinicasData ?? []).map((c) => [c.id, c as Clinica]));
  const propuestaPorLead = new Map((propuestasData ?? []).map((p) => [p.lead_id, p]));

  const totalClinicas = leads.length;
  const numRecibidas = conPropuesta.length;
  const clinicaElegida = leadElegido ? clinicaPorId.get(leadElegido.clinic_id) : undefined;
  const nombreElegida = clinicaElegida?.nombre ?? "Tu clínica";
  const inicialElegida = nombreElegida.charAt(0).toUpperCase();
  const estadoElegido = (leadElegido?.estado ?? null) as EstadoLead | null;
  const opcionesCita = leerOpcionesCita(leadElegido?.opciones_cita);
  const citaConfirmada =
    estadoElegido === "cita_programada" ||
    (estadoElegido != null && ESTADOS_CON_CITA_HECHA.includes(estadoElegido));
  const citaHecha = estadoElegido != null && ESTADOS_CON_CITA_HECHA.includes(estadoElegido);

  // ===== Filas "Tus clínicas" =====
  const orden: Record<TipoFilaClinica, number> = {
    nueva: 0,
    vista: 1,
    preparando: 2,
    pendiente: 3,
    descartada: 4,
  };
  const filas: FilaClinica[] = leads
    .map((l, i): FilaClinica => {
      const estado = l.estado as EstadoLead;
      const propuesta = propuestaPorLead.get(l.id);
      const tipo: TipoFilaClinica = l.descartado_por_paciente_en
        ? "descartada"
        : estado === "propuesta_enviada"
          ? l.propuesta_vista_en
            ? "vista"
            : "nueva"
          : estado === "enviado"
            ? "pendiente"
            : estado === "no_seleccionado" && !l.propuesta_enviada_en
              ? "pendiente"
              : "preparando";
      const revelada = Boolean(l.propuesta_enviada_en && propuesta);
      const clinica = revelada ? clinicaPorId.get(l.clinic_id) : undefined;
      const nombre = clinica?.nombre ?? `Clínica ${i + 1}`;
      return {
        leadId: l.id,
        tipo,
        nombre,
        inicial: clinica ? nombre.charAt(0).toUpperCase() : String(i + 1),
        logoUrl: clinica?.logo_url ?? null,
        detalle: clinica
          ? detalleClinica(clinica)
          : tipo === "pendiente"
            ? "Todavía no ha abierto tu solicitud"
            : "Ha visto tu caso y está preparando su propuesta",
        oferta: revelada && propuesta ? oferta(propuesta) : null,
      };
    })
    .sort((a, b) => orden[a.tipo] - orden[b.tipo]);

  // ===== Textos por momento =====
  const notificadas = solicitud.clinicas_notificadas;
  let titulo: string;
  let texto: string;
  if (leadElegido) {
    if (citaConfirmada) {
      titulo = `Cita confirmada con ${nombreElegida}`;
      texto = citaHecha
        ? "Ya hiciste tu valoración. Cuéntanos qué tal fue."
        : "Todo listo. Aquí tienes los detalles de tu valoración.";
    } else if (estadoElegido === "cita_pendiente" && opcionesCita.length > 0 && !leadElegido.otras_fechas_pedidas_en) {
      titulo = `${nombreElegida} te propone fechas`;
      texto = "Ya le hemos pasado tus datos. Elige la fecha que mejor te venga y confírmala; la clínica recibe el aviso al momento.";
    } else {
      titulo = `Has elegido ${nombreElegida}`;
      texto = leadElegido.otras_fechas_pedidas_en
        ? "Le hemos pedido otras fechas. Te avisaremos por email en cuanto te proponga nuevas."
        : "Ya tiene tus datos. En breve te propondrá fechas para tu valoración y te avisaremos por email.";
    }
  } else if (numRecibidas > 0) {
    titulo = `Ya tienes ${numRecibidas} ${numRecibidas === 1 ? "propuesta" : "propuestas"} de ${totalClinicas} ${totalClinicas === 1 ? "clínica" : "clínicas"}`;
    texto =
      numRecibidas < totalClinicas
        ? "Las hemos elegido porque son las que mejor encajan con lo que pediste. Revisa las que te han llegado; el resto siguen con tu caso y te avisaremos por email."
        : "Las hemos elegido porque son las que mejor encajan con lo que pediste. Revísalas y quédate con la que te convenza.";
  } else if (notificadas === null) {
    titulo = "¡Solicitud enviada!";
    texto = "La estamos haciendo llegar a las clínicas que mejor encajan con lo que buscas.";
  } else if (totalClinicas > 0) {
    titulo = `Tu solicitud ya está en manos de ${totalClinicas} ${totalClinicas === 1 ? "clínica" : "clínicas"}`;
    texto =
      "Las hemos elegido porque son las que mejor encajan con lo que pediste. Te avisaremos por email en cuanto llegue la primera propuesta.";
  } else {
    titulo = "Todavía no hay clínicas para tu solicitud";
    texto =
      "No hemos encontrado clínicas que encajen exactamente con esa ciudad o técnica. Puedes retirar esta solicitud y probar ampliando tus preferencias.";
  }

  // ===== Recorrido =====
  type EstadoPaso = "hecho" | "actual" | "pendiente";
  const pasos: { titulo: string; sub: string; estado: EstadoPaso }[] = [
    {
      titulo: "Solicitud enviada",
      sub: `${fechaCorta(solicitud.created_at)}${totalClinicas > 0 ? ` · a ${totalClinicas} ${totalClinicas === 1 ? "clínica" : "clínicas"}` : ""}`,
      estado: "hecho",
    },
    {
      titulo: leadElegido ? "Propuestas recibidas" : "Recibes propuestas",
      sub: leadElegido
        ? `${numRecibidas} ${numRecibidas === 1 ? "propuesta" : "propuestas"}`
        : numRecibidas > 0
          ? `${numRecibidas} de ${totalClinicas} recibidas`
          : "Te avisamos por email",
      estado: leadElegido ? "hecho" : "actual",
    },
    {
      titulo: leadElegido ? "Clínica elegida" : "Eliges clínica",
      sub: leadElegido
        ? `${nombreElegida}${leadElegido.seleccionado_en ? ` · ${fechaCorta(leadElegido.seleccionado_en)}` : ""}`
        : "Eliges la que te convenza",
      estado: leadElegido ? "hecho" : "pendiente",
    },
    {
      titulo: "Tu valoración",
      sub: citaConfirmada && leadElegido?.fecha_cita
        ? fechaCitaLarga(leadElegido.fecha_cita)
        : estadoElegido === "cita_pendiente" && opcionesCita.length > 0 && !leadElegido?.otras_fechas_pedidas_en
          ? "Elige fecha"
          : leadElegido
            ? "Esperando fechas de la clínica"
            : "La clínica te contacta para la cita",
      estado: citaHecha ? "hecho" : leadElegido ? "actual" : "pendiente",
    },
  ];
  const hechos = pasos.filter((p) => p.estado === "hecho").length;
  const progreso = Math.min(75, Math.max(0, (hechos - 1) * 25));

  const ahora = leadElegido
    ? citaConfirmada
      ? [
          { t: "Prepara tu cita", d: "Lleva tus analíticas si las tienes y apunta tus dudas." },
          { t: "Ve a tu valoración", d: "La clínica confirma tu caso y el presupuesto final." },
          { t: "Cuéntanos qué tal", d: "Tu opinión ayuda a otros pacientes a elegir mejor." },
        ]
      : [
          { t: "La clínica te propone fechas", d: "Te avisamos por email en cuanto lo haga." },
          { t: "Confirmas la que te venga", d: "Solo tienes que elegir una y confirmar." },
          { t: "Vas a tu valoración", d: "La clínica confirma tu caso y el presupuesto final." },
        ]
    : numRecibidas > 0
      ? [
          { t: "Revisa las propuestas", d: "Pulsa en cada clínica para ver su propuesta completa." },
          { t: "Espera a las demás", d: "Te avisamos por email cuando llegue una nueva." },
          { t: "Tú decides", d: "Elige con quién seguir. Solo esa clínica verá tu contacto." },
        ]
      : [
          { t: "Las clínicas revisan tu caso", d: "Ven tu informe y tus fotos, pero no tu nombre ni tu teléfono." },
          { t: "Te envían su propuesta", d: "Precio, tratamiento y condiciones. Te avisamos por email." },
          { t: "Tú decides", d: "Las revisas aquí mismo y eliges con quién seguir. Sin compromiso." },
        ];

  const resumen: { k: string; v: string }[] = [];
  resumen.push({
    k: "Tratamiento",
    v: solicitud.dejar_decidir_medico
      ? "Que decida el médico"
      : solicitud.tratamientos_interes.length > 0
        ? solicitud.tratamientos_interes.join(", ")
        : "Sin especificar",
  });
  if (solicitud.ciudad || solicitud.donde_tratamiento)
    resumen.push({
      k: "Dónde",
      v: solicitud.ciudad ?? etiqueta(DONDE_LABEL, solicitud.donde_tratamiento) ?? "",
    });
  if (solicitud.cuando_tratamiento)
    resumen.push({ k: "Cuándo", v: etiqueta(CUANDO_LABEL, solicitud.cuando_tratamiento) ?? "" });
  if (solicitud.presupuesto_rango)
    resumen.push({ k: "Presupuesto", v: labelPresupuesto(solicitud.presupuesto_rango) });
  resumen.push({ k: "Fotos", v: solicitud.estudio_id ? "Informe capilar adjunto" : "Sin fotos" });

  const propuestaElegida = leadElegido ? propuestaPorLead.get(leadElegido.id) : undefined;
  const lugarCita =
    clinicaElegida?.direccion ?? clinicaElegida?.ciudad ?? null;
  const modalidadCita = leadElegido?.fecha_cita
    ? opcionesCita.find((o) => o.fecha === leadElegido.fecha_cita)?.modalidad
    : undefined;

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        <CabeceraCuenta userId={user.id} email={user.email ?? null} />

        <div className="mt-7 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-10 sm:py-5">
            <Link href="/cuenta#presupuestos" className="text-sm font-medium text-teal hover:text-teal-dark">
              ← Mis presupuestos
            </Link>
            <span className="text-sm text-ink-soft">
              Solicitud del{" "}
              {new Date(solicitud.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {/* HERO */}
          <div className="grid items-center gap-6 px-5 pt-8 sm:px-10 sm:pt-9 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
            <div className="flex flex-col gap-3">
              <span className="self-start rounded-full bg-sage px-3.5 py-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-sage-ink">
                Tu solicitud de presupuesto
              </span>
              <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-teal-dark sm:text-[44px]">
                {titulo}
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-ink-soft sm:text-lg">{texto}</p>
            </div>
            {solicitud.match_score_paciente != null && (
              <div className="flex items-center gap-4 rounded-3xl bg-paper-dim p-5 sm:p-6">
                <SelloScore tipo="match" valor={solicitud.match_score_paciente} size={104} />
                <p className="text-[15px] leading-normal text-sage-ink">
                  <strong>Tu Match Score es del {solicitud.match_score_paciente}%.</strong> Son las
                  clínicas especializadas que han recibido tu solicitud, sobre el máximo de 5 que
                  compartimos por paciente.
                </p>
              </div>
            )}
          </div>

          {/* RECORRIDO */}
          <div className="px-5 pb-9 pt-7 sm:px-10">
            <ol className="relative grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
              <span
                aria-hidden
                className="absolute left-[12.5%] right-[12.5%] top-[21px] hidden h-1 rounded-full bg-line md:block"
              />
              <span
                aria-hidden
                className="absolute left-[12.5%] top-[21px] hidden h-1 rounded-full bg-gradient-to-r from-brand-green to-brand-blue md:block"
                style={{ width: `${progreso}%` }}
              />
              {pasos.map((p, i) => (
                <li key={p.titulo} className="relative flex flex-col items-center gap-2 text-center">
                  <span
                    className={`flex h-[46px] w-[46px] items-center justify-center rounded-full font-display text-lg font-extrabold ${
                      p.estado === "hecho"
                        ? "bg-brand-green text-teal-dark"
                        : p.estado === "actual"
                          ? "border-2 border-brand-green bg-[#f4f9f7] text-teal-dark"
                          : "border-2 border-dashed border-[#b9c9c4] bg-white text-[#9aa9a4]"
                    }`}
                  >
                    {p.estado === "hecho" ? "✓" : i + 1}
                  </span>
                  <span
                    className={`font-display text-[17px] font-bold ${
                      p.estado === "pendiente" ? "text-ink-soft" : "text-teal-dark"
                    }`}
                  >
                    {p.titulo}
                  </span>
                  <span className="max-w-[220px] text-sm leading-snug text-ink-soft">{p.sub}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* DOS COLUMNAS */}
          <div className="grid items-start gap-8 px-5 pb-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
            <div className="flex min-w-0 flex-col gap-7">
              {!leadElegido && totalClinicas > 0 && (
                <ClinicasSolicitud solicitudId={solicitud.id} filas={filas} totalClinicas={totalClinicas} />
              )}

              {!leadElegido && totalClinicas === 0 && notificadas !== null && (
                <section className="rounded-3xl border border-dashed border-line p-6 text-sm leading-relaxed text-ink-soft sm:p-8">
                  {solicitud.notificacion_error ?? "No hay clínicas asignadas a esta solicitud."}
                </section>
              )}

              {leadElegido &&
                estadoElegido === "cita_pendiente" &&
                opcionesCita.length > 0 &&
                !leadElegido.otras_fechas_pedidas_en && (
                  <ElegirFecha
                    solicitudId={solicitud.id}
                    leadId={leadElegido.id}
                    nombreClinica={nombreElegida}
                    inicial={inicialElegida}
                    opciones={opcionesCita}
                    direccion={clinicaElegida?.direccion ?? clinicaElegida?.ciudad ?? null}
                  />
                )}

              {leadElegido &&
                (citaConfirmada ||
                  !(estadoElegido === "cita_pendiente" && opcionesCita.length > 0 && !leadElegido.otras_fechas_pedidas_en)) && (
                  <section className="flex flex-col gap-6 rounded-3xl border-2 border-brand-green bg-[#f4fbf7] p-6 sm:p-8">
                    <div className="flex items-center gap-4">
                      {clinicaElegida?.logo_url ? (
                        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sage">
                          <Image src={clinicaElegida.logo_url} alt="" fill sizes="64px" className="object-cover" />
                        </span>
                      ) : (
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sage font-display text-2xl font-extrabold text-sage-ink">
                          {inicialElegida}
                        </span>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="text-[13px] font-bold uppercase tracking-[0.05em] text-sage-ink">
                          Tu clínica
                        </span>
                        <span className="font-display text-2xl font-extrabold text-teal-dark sm:text-[28px]">
                          {nombreElegida}
                        </span>
                        <span className="text-sm text-ink-soft">
                          {[
                            detalleClinica(clinicaElegida),
                            propuestaElegida?.tratamiento,
                            propuestaElegida ? formatearPrecioPropuesta(propuestaElegida) : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1.5 rounded-2xl bg-white p-5">
                        <span className="text-[13px] font-semibold text-ink-soft">Tu cita de valoración</span>
                        {citaConfirmada && leadElegido.fecha_cita ? (
                          <>
                            <span className="font-display text-[22px] font-extrabold text-teal-dark">
                              {fechaCitaLarga(leadElegido.fecha_cita)}
                            </span>
                            <span className="text-sm text-ink-soft">
                              {modalidadCita === "videollamada"
                                ? "Videollamada"
                                : `En clínica${lugarCita ? ` · ${lugarCita}` : ""}`}
                            </span>
                            {!citaHecha && (
                              <a
                                href={calendarioGoogle(
                                  `Valoración capilar · ${nombreElegida}`,
                                  leadElegido.fecha_cita,
                                  modalidadCita === "videollamada" ? null : lugarCita,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-teal hover:text-teal-dark"
                              >
                                Añadir a mi calendario
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-[15px] leading-relaxed text-ink">
                            {leadElegido.otras_fechas_pedidas_en
                              ? "Has pedido otras fechas. La clínica te propondrá nuevas en breve."
                              : "La clínica te propondrá fechas en breve. Te avisaremos por email."}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 rounded-2xl bg-white p-5">
                        <span className="text-[13px] font-semibold text-ink-soft">Mensaje de la clínica</span>
                        <span className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
                          {propuestaElegida?.mensaje ? `“${propuestaElegida.mensaje}”` : "Sin mensaje."}
                        </span>
                      </div>
                    </div>

                    <p className="flex items-center gap-2.5 text-sm text-sage-ink">
                      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-sage font-extrabold">
                        ✓
                      </span>
                      Le hemos compartido tu nombre, teléfono y email. El resto de clínicas ya no ven tu
                      solicitud.
                    </p>
                  </section>
                )}

              {leadElegido &&
                citaHecha &&
                (leadElegido.feedback_recibido_en ? (
                  <p className="text-sm text-ink-soft">
                    Gracias por tu valoración: ya se la hemos hecho llegar a la clínica.
                  </p>
                ) : (
                  <FeedbackForm solicitudId={solicitud.id} leadId={leadElegido.id} />
                ))}

              <section className="flex flex-col gap-4">
                <h2 className="font-display text-2xl font-extrabold text-teal-dark">Datos de tu solicitud</h2>
                <dl className="flex flex-col divide-y divide-line rounded-3xl border border-line bg-white px-5 text-sm sm:px-8">
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
                  {solicitud.codigo_postal && (
                    <Row label="Código postal" value={solicitud.codigo_postal} />
                  )}
                  {solicitud.progresion_perdida && (
                    <Row
                      label="Progresión de la pérdida"
                      value={etiqueta(PROGRESION_LABEL, solicitud.progresion_perdida)!}
                    />
                  )}
                  {solicitud.antecedentes_familiares && (
                    <Row
                      label="Antecedentes familiares"
                      value={solicitud.antecedentes_familiares}
                    />
                  )}
                  {solicitud.medicacion_actual && (
                    <Row
                      label="Medicación actual"
                      value={solicitud.medicacion_actual}
                    />
                  )}
                  {solicitud.sintomas_cuero_cabelludo.length > 0 && (
                    <Row
                      label="Síntomas en el cuero cabelludo"
                      value={solicitud.sintomas_cuero_cabelludo
                        .map((s) => SINTOMAS_CUERO_CABELLUDO_LABEL[s] ?? s)
                        .join(", ")}
                    />
                  )}
                  {solicitud.tratamientos_usados.length > 0 && (
                    <Row
                      label="Tratamientos ya probados"
                      value={
                        solicitud.tratamientos_usados
                          .map((t) => TRATAMIENTOS_USADOS_LABEL[t] ?? t)
                          .join(", ") +
                        (solicitud.tratamientos_usados_detalle
                          ? ` — ${solicitud.tratamientos_usados_detalle}`
                          : "")
                      }
                    />
                  )}
                  {solicitud.cambios_salud_recientes && (
                    <Row
                      label="Cambios de salud recientes"
                      value={solicitud.cambios_salud_recientes}
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
                </dl>
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="font-display text-2xl font-extrabold text-teal-dark">Qué pasa ahora</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {ahora.map((a, i) => (
                    <div key={a.t} className="flex flex-col gap-2 rounded-[20px] bg-[#f4f9f7] p-5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow font-display font-extrabold text-teal-dark">
                        {i + 1}
                      </span>
                      <span className="font-display text-lg font-bold text-teal-dark">{a.t}</span>
                      <span className="text-sm leading-normal text-ink-soft">{a.d}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* DERECHA */}
            <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
              <div className="flex flex-col gap-3.5 rounded-3xl border border-line p-6">
                <h3 className="font-display text-xl font-extrabold text-teal-dark">Lo que pediste</h3>
                <dl className="flex flex-col gap-2.5 text-sm">
                  {resumen.map((r) => (
                    <div key={r.k} className="flex justify-between gap-3 border-b border-[#eef3f1] pb-2.5">
                      <dt className="text-ink-soft">{r.k}</dt>
                      <dd className="text-right font-semibold text-teal-dark">{r.v}</dd>
                    </div>
                  ))}
                </dl>
                {solicitud.estudio_id && (
                  <Link
                    href={`/cuenta/analisis/${solicitud.estudio_id}`}
                    className="text-sm font-semibold text-teal hover:text-teal-dark"
                  >
                    Ver mi informe capilar →
                  </Link>
                )}
              </div>

              <div className="flex gap-3 rounded-[20px] bg-[#f4f9f7] px-5 py-4 text-sm leading-normal text-ink-soft">
                <Lock className="h-5 w-5 shrink-0 text-teal-dark" aria-hidden />
                <span>
                  Tus datos de contacto solo llegan a la clínica que elijas. Puedes retirar la solicitud
                  cuando quieras.
                </span>
              </div>
              <div className="self-start">
                <BorrarSolicitudButton id={solicitud.id} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-1 py-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
