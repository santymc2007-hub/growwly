import Link from "next/link";
import { redirect } from "next/navigation";
import { User, Camera, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { MUNICIPIOS_MALLORCA } from "@/lib/clinic-options";
import { contactoLiberado, type EstadoLead } from "@/lib/leads/estados-lead";
import { actualizarPerfil, cambiarEmail, cambiarPassword } from "./actions";
import { CabeceraCuenta } from "@/components/cuenta/cabecera-cuenta";
import { SeccionPlegable } from "@/components/cuenta/secciones-cuenta";
import { BorrarEstudioButton } from "./analisis/[id]/borrar-estudio-button";
import { CONTENIDO_FLUJOS } from "@/lib/informe/flujos";
import type { Flujo } from "@/lib/informe/tipos";
import { BorrarSolicitudButton } from "./solicitud/[id]/borrar-solicitud-button";

type SearchParams = { error?: string; guardado?: string; aviso?: string };

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, guardado, aviso } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: estudios } = await supabase
    .from("estudios_capilares")
    .select("id, estado, norwood_estimado, flujo, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: solicitudes } = await supabase
    .from("solicitudes_presupuesto")
    .select("id, estado, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // RLS de "leads_clinica" es solo para el backend — hace falta el
  // cliente admin para saber, por solicitud, cuántas propuestas ha
  // recibido el paciente y si ya eligió clínica.
  const infoPropuestasPorSolicitud = new Map<
    string,
    { propuestasPendientes: number; propuestasRecibidas: number; clinicaElegida: boolean }
  >();
  if (solicitudes && solicitudes.length > 0) {
    const admin = createAdminClient();
    const { data: leads } = await admin
      .from("leads_clinica")
      .select("solicitud_id, estado, propuesta_vista_en")
      .in(
        "solicitud_id",
        solicitudes.map((s) => s.id),
      );

    for (const lead of leads ?? []) {
      const estado = lead.estado as EstadoLead;
      const actual = infoPropuestasPorSolicitud.get(lead.solicitud_id) ?? {
        propuestasPendientes: 0,
        propuestasRecibidas: 0,
        clinicaElegida: false,
      };
      if (estado === "propuesta_enviada") actual.propuestasRecibidas++;
      if (estado === "propuesta_enviada" && !lead.propuesta_vista_en) actual.propuestasPendientes++;
      if (contactoLiberado(estado)) actual.clinicaElegida = true;
      infoPropuestasPorSolicitud.set(lead.solicitud_id, actual);
    }
  }

  const totalPropuestasNuevas = Array.from(
    infoPropuestasPorSolicitud.values(),
  ).reduce((total, info) => total + info.propuestasPendientes, 0);

  const fechaActual = profile?.fecha_nacimiento
    ? new Date(profile.fecha_nacimiento)
    : null;
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 77 }, (_, i) => anioActual - 14 - i);

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <CabeceraCuenta userId={user.id} email={user.email ?? null} />

        {guardado && (
          <p className="mt-4 rounded-lg bg-sage px-4 py-3 text-sm text-sage-ink">
            Datos guardados.
          </p>
        )}
        {aviso && (
          <p className="mt-4 rounded-lg bg-cyan/10 px-4 py-3 text-sm text-cyan-dark">
            {decodeURIComponent(aviso)}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            {decodeURIComponent(error)}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-4">
          <SeccionPlegable
            id="datos"
            titulo="Mis datos personales"
            icono={<User className="h-5 w-5" aria-hidden />}
            resumen={
              [profile?.nombre, profile?.apellidos].filter(Boolean).join(" ") ||
              user.email
            }
          >
            <div className="grid items-start gap-6 lg:grid-cols-3">
              <div className="rounded-2xl bg-paper-dim/60 p-5">
                <h3 className="font-display text-base text-teal-dark">
                  Tus datos
                </h3>
                <form
                  action={actualizarPerfil}
                  className="mt-4 flex flex-col gap-4"
                >
                  <div>
                    <label htmlFor="nombre" className={labelClass}>
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      defaultValue={profile?.nombre ?? undefined}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="apellidos" className={labelClass}>
                      Apellidos
                    </label>
                    <input
                      id="apellidos"
                      name="apellidos"
                      defaultValue={profile?.apellidos ?? undefined}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className={labelClass}>
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      defaultValue={profile?.telefono ?? undefined}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="ciudad" className={labelClass}>
                      Ciudad
                    </label>
                    <select
                      id="ciudad"
                      name="ciudad"
                      defaultValue={profile?.ciudad ?? ""}
                      className={inputClass}
                    >
                      <option value="">Selecciona un municipio</option>
                      {MUNICIPIOS_MALLORCA.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className={labelClass}>Fecha de nacimiento</p>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      <select
                        name="nacimiento_dia"
                        defaultValue={fechaActual?.getDate() ?? ""}
                        className={inputClass}
                      >
                        <option value="">Día</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(
                          (d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ),
                        )}
                      </select>
                      <select
                        name="nacimiento_mes"
                        defaultValue={
                          fechaActual ? fechaActual.getMonth() + 1 : ""
                        }
                        className={inputClass}
                      >
                        <option value="">Mes</option>
                        {[
                          "Enero",
                          "Febrero",
                          "Marzo",
                          "Abril",
                          "Mayo",
                          "Junio",
                          "Julio",
                          "Agosto",
                          "Septiembre",
                          "Octubre",
                          "Noviembre",
                          "Diciembre",
                        ].map((nombreMes, i) => (
                          <option key={nombreMes} value={i + 1}>
                            {nombreMes}
                          </option>
                        ))}
                      </select>
                      <select
                        name="nacimiento_anio"
                        defaultValue={fechaActual?.getFullYear() ?? ""}
                        className={inputClass}
                      >
                        <option value="">Año</option>
                        {anios.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="acepta_marketing_email"
                      defaultChecked={profile?.acepta_marketing_email ?? false}
                      className="mt-0.5"
                    />
                    <span>
                      Quiero recibir novedades de Growwly por email
                      (consejos, nuevas clínicas, ofertas). Opcional, puedes
                      cambiarlo cuando quieras.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="mt-2 self-start rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-dark"
                  >
                    Guardar cambios
                  </button>
                </form>
              </div>

              <div className="rounded-2xl bg-paper-dim/60 p-5">
                <h3 className="font-display text-base text-teal-dark">Email</h3>
                <p className="mt-1 text-xs text-ink-soft">
                  Actual: {user.email}
                </p>
                <form
                  action={cambiarEmail}
                  className="mt-3 flex flex-col gap-3"
                >
                  <input
                    type="email"
                    name="nuevo_email"
                    placeholder="Nuevo email"
                    required
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    className="self-start rounded-full border border-teal px-4 py-2 text-sm font-medium text-teal-dark transition hover:bg-teal/5"
                  >
                    Cambiar email
                  </button>
                </form>
              </div>

              <div className="rounded-2xl bg-paper-dim/60 p-5">
                <h3 className="font-display text-base text-teal-dark">
                  Contraseña
                </h3>
                <form
                  action={cambiarPassword}
                  className="mt-3 flex flex-col gap-3"
                >
                  <input
                    type="password"
                    name="nueva_password"
                    placeholder="Nueva contraseña"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                  />
                  <input
                    type="password"
                    name="nueva_password2"
                    placeholder="Repite la nueva contraseña"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    className="self-start rounded-full border border-teal px-4 py-2 text-sm font-medium text-teal-dark transition hover:bg-teal/5"
                  >
                    Cambiar contraseña
                  </button>
                </form>
              </div>
            </div>
          </SeccionPlegable>

        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          <section
            id="analisis"
            className="scroll-mt-6 rounded-3xl border border-line bg-white p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-dim text-teal">
                  <Camera className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="font-display text-xl font-bold text-teal-dark">
                    Mis análisis
                  </span>
                  <span className="text-sm text-ink-soft">
                    {estudios && estudios.length > 0
                      ? `${estudios.length} análisis`
                      : "Todavía no has hecho ninguno"}
                  </span>
                </span>
              </div>
              <Link
                href="/analisis/nuevo"
                className="press rounded-full bg-teal-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                + Nuevo análisis
              </Link>
            </div>

            {estudios && estudios.length > 0 ? (
              <ul className="mt-5 flex flex-col gap-3">
                {estudios.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-col gap-3 rounded-2xl border border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold leading-snug text-teal-dark">
                        {e.flujo && e.flujo in CONTENIDO_FLUJOS
                          ? CONTENIDO_FLUJOS[e.flujo as Flujo].etiqueta
                          : (e.norwood_estimado ?? "Análisis capilar")}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {new Date(e.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                      {e.estado === "listo" ? (
                        <Link
                          href={`/cuenta/analisis/${e.id}`}
                          className="press rounded-full bg-yellow px-4 py-2 text-sm font-semibold text-teal-dark hover:opacity-90"
                        >
                          Ver informe →
                        </Link>
                      ) : (
                        <span className="text-sm text-ink-soft">
                          {e.estado === "procesando"
                            ? "Procesando…"
                            : "Error en el análisis"}
                        </span>
                      )}
                      <BorrarEstudioButton id={e.id} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-ink-soft">
                Todavía no has subido fotos para un análisis orientativo.
              </p>
            )}
          </section>

          <section
            id="presupuestos"
            className="scroll-mt-6 rounded-3xl border border-line bg-white p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-dim text-teal">
                  <Mail className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="flex items-center gap-2 font-display text-xl font-bold text-teal-dark">
                    Mis presupuestos
                    {totalPropuestasNuevas > 0 && (
                      <span className="rounded-full bg-orange px-2 py-0.5 text-xs font-bold text-[#8a5a00]">
                        {totalPropuestasNuevas} {totalPropuestasNuevas === 1 ? "nueva" : "nuevas"}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-ink-soft">
                    {solicitudes && solicitudes.length > 0
                      ? `${solicitudes.length} ${solicitudes.length === 1 ? "solicitud" : "solicitudes"}`
                      : "Todavía no has pedido presupuesto"}
                  </span>
                </span>
              </div>
              <Link
                href="/cuenta/solicitud/nueva"
                className="press rounded-full bg-teal-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                + Pedir presupuesto
              </Link>
            </div>

            {solicitudes && solicitudes.length > 0 ? (
              <ul className="mt-5 flex flex-col gap-3">
                {solicitudes.map((s) => {
                  const info = infoPropuestasPorSolicitud.get(s.id);
                  return (
                    <li
                      key={s.id}
                      className="flex flex-col gap-3 rounded-2xl border border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-base font-bold leading-snug text-teal-dark">
                          Solicitud del{" "}
                          {new Date(s.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                        <div className="mt-1">
                          {info?.clinicaElegida ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-xs font-semibold text-sage-ink">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                              Clínica elegida
                            </span>
                          ) : info && info.propuestasPendientes > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3 py-1 text-xs font-bold text-[#8a5a00]">
                              <Mail className="h-3.5 w-3.5" aria-hidden />
                              {info.propuestasPendientes}{" "}
                              {info.propuestasPendientes === 1
                                ? "propuesta nueva"
                                : "propuestas nuevas"}
                            </span>
                          ) : info && info.propuestasRecibidas > 0 ? (
                            <span className="inline-flex rounded-full bg-paper-dim px-3 py-1 text-xs font-semibold text-teal-dark">
                              {info.propuestasRecibidas}{" "}
                              {info.propuestasRecibidas === 1 ? "propuesta recibida" : "propuestas recibidas"}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-paper-dim px-3 py-1 text-xs font-medium text-ink-soft">
                              Esperando propuestas
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                        <Link
                          href={`/cuenta/solicitud/${s.id}`}
                          className="press rounded-full bg-yellow px-4 py-2 text-sm font-semibold text-teal-dark hover:opacity-90"
                        >
                          Ver solicitud →
                        </Link>
                        <BorrarSolicitudButton id={s.id} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-ink-soft">
                Todavía no has pedido presupuesto a ninguna clínica.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
