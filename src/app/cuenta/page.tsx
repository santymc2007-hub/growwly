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
import {
  SeccionesCuenta,
  SeccionPlegable,
} from "@/components/cuenta/secciones-cuenta";
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

        <SeccionesCuenta
          inicial={totalPropuestasNuevas > 0 ? "presupuestos" : "analisis"}
          nav={[
            { id: "datos", label: "Mis datos personales" },
            { id: "analisis", label: "Mis análisis" },
            {
              id: "presupuestos",
              label: "Mis presupuestos",
              aviso:
                totalPropuestasNuevas > 0
                  ? `${totalPropuestasNuevas} ${totalPropuestasNuevas === 1 ? "nueva" : "nuevas"}`
                  : undefined,
            },
          ]}
        >
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

          <SeccionPlegable
            id="analisis"
            titulo="Mis análisis"
            icono={<Camera className="h-5 w-5" aria-hidden />}
            resumen={
              estudios && estudios.length > 0
                ? `${estudios.length} análisis`
                : "Todavía no has hecho ninguno"
            }
            acciones={
              <Link
                href="/analisis/nuevo"
                className="press rounded-full bg-teal-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                + Nuevo análisis
              </Link>
            }
          >
            {estudios && estudios.length > 0 ? (
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {estudios.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-col gap-3 rounded-2xl border border-line p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal">
                      {new Date(e.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="font-display text-lg font-bold leading-snug text-teal-dark">
                      {e.flujo && e.flujo in CONTENIDO_FLUJOS
                        ? CONTENIDO_FLUJOS[e.flujo as Flujo].etiqueta
                        : (e.norwood_estimado ?? "Análisis capilar")}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
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
              <p className="text-sm text-ink-soft">
                Todavía no has subido fotos para un análisis orientativo.
              </p>
            )}
          </SeccionPlegable>

          <SeccionPlegable
            id="presupuestos"
            titulo="Mis presupuestos"
            icono={<Mail className="h-5 w-5" aria-hidden />}
            resumen={
              solicitudes && solicitudes.length > 0
                ? `${solicitudes.length} ${solicitudes.length === 1 ? "solicitud" : "solicitudes"}`
                : "Todavía no has pedido presupuesto"
            }
            acciones={
              <Link
                href="/cuenta/solicitud/nueva"
                className="press rounded-full bg-teal-dark px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                + Pedir presupuesto
              </Link>
            }
          >
            {solicitudes && solicitudes.length > 0 ? (
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {solicitudes.map((s) => {
                  const info = infoPropuestasPorSolicitud.get(s.id);
                  return (
                    <li
                      key={s.id}
                      className="flex flex-col gap-3 rounded-2xl border border-line p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-teal">
                        Solicitud del{" "}
                        {new Date(s.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      {info?.clinicaElegida ? (
                        <span className="flex items-center gap-1.5 self-start rounded-full bg-sage px-3 py-1 text-sm font-semibold text-sage-ink">
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Clínica elegida
                        </span>
                      ) : info && info.propuestasPendientes > 0 ? (
                        <span className="flex items-center gap-1.5 self-start rounded-full bg-yellow px-3 py-1 text-sm font-bold text-teal-dark">
                          <Mail className="h-4 w-4" aria-hidden />
                          {info.propuestasPendientes}{" "}
                          {info.propuestasPendientes === 1
                            ? "propuesta nueva"
                            : "propuestas nuevas"}
                        </span>
                      ) : info && info.propuestasRecibidas > 0 ? (
                        <span className="self-start rounded-full bg-paper-dim px-3 py-1 text-sm font-semibold text-teal-dark">
                          {info.propuestasRecibidas}{" "}
                          {info.propuestasRecibidas === 1 ? "propuesta recibida" : "propuestas recibidas"}
                        </span>
                      ) : (
                        <span className="self-start rounded-full bg-paper-dim px-3 py-1 text-sm font-medium text-ink-soft">
                          Esperando propuestas
                        </span>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
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
              <p className="text-sm text-ink-soft">
                Todavía no has pedido presupuesto a ninguna clínica.
              </p>
            )}
          </SeccionPlegable>
        </SeccionesCuenta>
      </div>
    </main>
  );
}
