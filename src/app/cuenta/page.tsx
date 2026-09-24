import Link from "next/link";
import { redirect } from "next/navigation";
import { User, Camera, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { MUNICIPIOS_MALLORCA } from "@/lib/clinic-options";
import { contactoLiberado, type EstadoLead } from "@/lib/leads/estados-lead";
import {
  actualizarPerfil,
  cambiarEmail,
  cambiarPassword,
  cerrarSesionPaciente,
} from "./actions";
import { BorrarEstudioButton } from "./analisis/[id]/borrar-estudio-button";
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
    .select("id, estado, norwood_estimado, created_at")
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
    { propuestasPendientes: number; clinicaElegida: boolean }
  >();
  if (solicitudes && solicitudes.length > 0) {
    const admin = createAdminClient();
    const { data: leads } = await admin
      .from("leads_clinica")
      .select("solicitud_id, estado")
      .in(
        "solicitud_id",
        solicitudes.map((s) => s.id),
      );

    for (const lead of leads ?? []) {
      const estado = lead.estado as EstadoLead;
      const actual = infoPropuestasPorSolicitud.get(lead.solicitud_id) ?? {
        propuestasPendientes: 0,
        clinicaElegida: false,
      };
      if (estado === "propuesta_enviada") actual.propuestasPendientes++;
      if (contactoLiberado(estado)) actual.clinicaElegida = true;
      infoPropuestasPorSolicitud.set(lead.solicitud_id, actual);
    }
  }

  const fechaActual = profile?.fecha_nacimiento
    ? new Date(profile.fecha_nacimiento)
    : null;
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 77 }, (_, i) => anioActual - 14 - i);

  const totalPropuestasPendientes = Array.from(
    infoPropuestasPorSolicitud.values(),
  ).reduce((total, info) => total + info.propuestasPendientes, 0);

  const inicial = (profile?.nombre ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />

      <div className="mx-auto max-w-[1600px] px-6 py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal font-display text-lg font-bold text-paper">
              {inicial}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl text-teal-dark">
                  Mi cuenta
                </h1>
                {totalPropuestasPendientes > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-cyan/15 px-2.5 py-1 text-xs font-bold text-cyan-dark">
                    <Mail className="h-3.5 w-3.5" aria-hidden />
                    {totalPropuestasPendientes}{" "}
                    {totalPropuestasPendientes === 1 ? "propuesta nueva" : "propuestas nuevas"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
            </div>
          </div>
          <form action={cerrarSesionPaciente}>
            <button
              type="submit"
              className="text-sm font-medium text-ink-soft hover:text-error"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

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

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Columna 1: datos del perfil */}
          <section className="flex flex-col gap-6">
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-lg text-teal-dark">
                <User className="h-5 w-5 text-teal" aria-hidden />
                Mis datos personales
              </h2>
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
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
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

            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-base text-teal-dark">
                Email
              </h2>
              <p className="mt-1 text-xs text-ink-soft">
                Actual: {user.email}
              </p>
              <form action={cambiarEmail} className="mt-3 flex flex-col gap-3">
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

            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-base text-teal-dark">
                Contraseña
              </h2>
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
          </section>

          {/* Columna 2: análisis capilar */}
          <section className="flex flex-col rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg text-teal-dark">
                <Camera className="h-5 w-5 text-teal" aria-hidden />
                Mis análisis
              </h2>
              <Link
                href="/analisis/nuevo"
                className="rounded-full bg-teal px-3 py-1.5 text-xs font-medium text-paper hover:bg-teal-dark"
              >
                + Nuevo análisis
              </Link>
            </div>

            {estudios && estudios.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {estudios.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-col gap-1 rounded-xl border border-line px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/cuenta/analisis/${e.id}`}
                      className="flex items-center justify-between hover:text-teal"
                    >
                      <span className="text-ink">
                        {new Date(e.created_at).toLocaleDateString("es-ES")}
                        {e.norwood_estimado && ` · ${e.norwood_estimado}`}
                      </span>
                      <span className="text-xs text-ink-soft">
                        {e.estado === "listo"
                          ? "Ver →"
                          : e.estado === "procesando"
                            ? "Procesando…"
                            : "Error"}
                      </span>
                    </Link>
                    <div className="flex justify-end">
                      <BorrarEstudioButton id={e.id} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">
                Todavía no has subido fotos para un análisis orientativo.
              </p>
            )}
          </section>

          {/* Columna 3: solicitudes de presupuesto — con más peso visual,
              porque aquí es donde el paciente se entera de si tiene
              propuestas esperando o ya ha elegido clínica. */}
          <section className="flex flex-col rounded-2xl border-2 border-teal/25 bg-teal/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-lg text-teal-dark">
                <Mail className="h-5 w-5 text-teal" aria-hidden />
                Mis presupuestos
              </h2>
              <Link
                href="/cuenta/solicitud/nueva"
                className="shrink-0 rounded-full bg-cyan px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-dark"
              >
                + Pedir
              </Link>
            </div>

            {solicitudes && solicitudes.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {solicitudes.map((s) => {
                  const info = infoPropuestasPorSolicitud.get(s.id);
                  return (
                    <li
                      key={s.id}
                      className="flex flex-col gap-1 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    >
                      <Link
                        href={`/cuenta/solicitud/${s.id}`}
                        className="flex items-center justify-between hover:text-teal"
                      >
                        <span className="text-ink">
                          {new Date(s.created_at).toLocaleDateString("es-ES")}
                        </span>
                        {info?.clinicaElegida ? (
                          <span className="flex items-center gap-1 rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-sage-ink">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                            Clínica elegida
                          </span>
                        ) : info && info.propuestasPendientes > 0 ? (
                          <span className="flex items-center gap-1 rounded-full bg-cyan/15 px-2 py-0.5 text-xs font-bold text-cyan-dark">
                            <Mail className="h-3.5 w-3.5" aria-hidden />
                            {info.propuestasPendientes}{" "}
                            {info.propuestasPendientes === 1 ? "propuesta" : "propuestas"}
                          </span>
                        ) : (
                          <span className="text-xs capitalize text-ink-soft">
                            {s.estado}
                          </span>
                        )}
                      </Link>
                      <div className="flex justify-end">
                        <BorrarSolicitudButton id={s.id} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">
                Todavía no has pedido presupuesto a ninguna clínica.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
