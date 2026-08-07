import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { actualizarPerfil, cerrarSesionPaciente } from "./actions";
import { BorrarEstudioButton } from "./analisis/[id]/borrar-estudio-button";
import { BorrarSolicitudButton } from "./solicitud/[id]/borrar-solicitud-button";

type SearchParams = { error?: string; guardado?: string };

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, guardado } = await searchParams;

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

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-6 py-10">
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
        {error && (
          <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
            {decodeURIComponent(error)}
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Columna 1: datos del perfil */}
          <section className="flex flex-col rounded-xl border border-line bg-white p-5">
            <h2 className="font-display text-lg text-teal-dark">
              Mis datos
            </h2>
            <form
              action={actualizarPerfil}
              className="mt-4 flex flex-1 flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="nombre"
                  className="text-sm font-medium text-ink"
                >
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  defaultValue={profile?.nombre ?? undefined}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>
              <div>
                <label
                  htmlFor="apellidos"
                  className="text-sm font-medium text-ink"
                >
                  Apellidos
                </label>
                <input
                  id="apellidos"
                  name="apellidos"
                  defaultValue={profile?.apellidos ?? undefined}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>
              <div>
                <label
                  htmlFor="telefono"
                  className="text-sm font-medium text-ink"
                >
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  defaultValue={profile?.telefono ?? undefined}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>
              <div>
                <label
                  htmlFor="edad"
                  className="text-sm font-medium text-ink"
                >
                  Edad
                </label>
                <input
                  id="edad"
                  name="edad"
                  type="number"
                  min="16"
                  max="100"
                  defaultValue={profile?.edad ?? undefined}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>

              <button
                type="submit"
                className="mt-auto self-start rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-dark"
              >
                Guardar cambios
              </button>
            </form>
          </section>

          {/* Columna 2: análisis capilar */}
          <section className="flex flex-col rounded-xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-teal-dark">
                Mi análisis
              </h2>
              <Link
                href="/analisis/nuevo"
                className="rounded-lg bg-teal px-3 py-1.5 text-xs font-medium text-paper hover:bg-teal-dark"
              >
                + Nuevo análisis
              </Link>
            </div>

            {estudios && estudios.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {estudios.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-col gap-1 rounded-lg border border-line px-3 py-2 text-sm"
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
          <section className="flex flex-col rounded-xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-teal-dark">
                Mis presupuestos
              </h2>
              <Link
                href="/cuenta/solicitud/nueva"
                className="rounded-lg bg-cyan px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-dark"
              >
                + Pedir
              </Link>
            </div>

            {solicitudes && solicitudes.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {solicitudes.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-col gap-1 rounded-lg border border-line px-3 py-2 text-sm"
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
