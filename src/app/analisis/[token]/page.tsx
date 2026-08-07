import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";

type Params = { token: string };

export default async function AnalisisPendientePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: estudio } = await supabase
    .from("estudios_capilares")
    .select("id, user_id, estado")
    .eq("claim_token", token)
    .maybeSingle();

  if (!estudio) {
    notFound();
  }

  // Si ya está reclamado (p. ej. recargó la página tras loguearse),
  // llevarlo directo al resultado.
  if (estudio.user_id) {
    redirect(`/cuenta/analisis/${estudio.id}`);
  }

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-md px-6 py-16 text-center">
        {estudio.estado === "procesando" && (
          <>
            <h1 className="font-display text-2xl text-teal-dark">
              Estamos analizando tus fotos…
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Recarga esta página en unos segundos.
            </p>
          </>
        )}

        {estudio.estado === "error" && (
          <>
            <h1 className="font-display text-2xl text-teal-dark">
              Algo no ha ido bien
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              No hemos podido completar el análisis esta vez.
            </p>
            <Link
              href="/analisis/nuevo"
              className="mt-4 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
            >
              Inténtalo de nuevo →
            </Link>
          </>
        )}

        {estudio.estado === "listo" && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-4 py-1.5 text-sm font-medium text-sage-ink">
              ✓ Tu análisis está listo
            </span>
            <h1 className="mt-4 font-display text-2xl text-teal-dark">
              Crea tu cuenta gratis para verlo
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Es gratis y tarda un minuto. Tu análisis quedará guardado en tu
              perfil, listo para pedir presupuesto cuando quieras.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href={`/cuenta/registro?claim=${token}`}
                className="rounded-lg bg-teal px-5 py-3 text-sm font-medium text-paper transition hover:bg-teal-dark"
              >
                Crear cuenta y ver mi análisis →
              </Link>
              <Link
                href={`/cuenta/login?claim=${token}`}
                className="text-sm font-medium text-cyan hover:text-cyan-dark"
              >
                Ya tengo cuenta — iniciar sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
