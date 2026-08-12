import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { MUNICIPIOS_MALLORCA } from "@/lib/clinic-options";
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

  const fechaActual = profile?.fecha_nacimiento
    ? new Date(profile.fecha_nacimiento)
    : null;
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 77 }, (_, i) => anioActual - 14 - i);

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />

      <div className="mx-auto max-w-[1600px] px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-teal-dark">
              Mi cuenta
            </h1>
            <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
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
              <h2 className="font-display text-lg text-teal-dark">
                Mis datos
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
              <h2 className="font-display text-lg text-teal-dark">
                Mi análisis
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

          {/* Columna 3: solicitudes de presupuesto */}
          <section className="flex flex-col rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-teal-dark">
                Mis presupuestos
              </h2>
              <Link
                href="/cuenta/solicitud/nueva"
                className="rounded-full bg-cyan px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-dark"
              >
                + Pedir
              </Link>
            </div>

            {solicitudes && solicitudes.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {solicitudes.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-1 rounded-xl border border-line px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/cuenta/solicitud/${s.id}`}
                      className="flex items-center justify-between hover:text-teal"
                    >
                      <span className="text-ink">
                        {new Date(s.created_at).toLocaleDateString("es-ES")}
                      </span>
                      <span className="text-xs capitalize text-ink-soft">
                        {s.estado}
                      </span>
                    </Link>
                    <div className="flex justify-end">
                      <BorrarSolicitudButton id={s.id} />
                    </div>
                  </li>
                ))}
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
