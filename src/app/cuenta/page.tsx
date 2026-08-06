import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { actualizarPerfil, cerrarSesionPaciente } from "./actions";

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

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-lg px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-teal-dark">Mi cuenta</h1>
          <form action={cerrarSesionPaciente}>
            <button
              type="submit"
              className="text-sm font-medium text-ink-soft hover:text-error"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
        <p className="mt-1 text-sm text-ink-soft">{user.email}</p>

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

        <form action={actualizarPerfil} className="mt-8 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <label htmlFor="edad" className="text-sm font-medium text-ink">
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
          </div>

          <button
            type="submit"
            className="mt-2 self-start rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-dark"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </main>
  );
}
