import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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
    <main className="flex min-h-screen flex-1 flex-col">
      <div
        className="flex-1 bg-cover bg-center"
        style={{ backgroundImage: "url(/brand/fondo-hero.png)" }}
      >
        <SiteHeader />

        <div className="mx-auto grid max-w-4xl items-center gap-8 px-6 py-16 md:grid-cols-[1fr_220px] md:py-24">
          <div className="text-center md:text-left">
            {estudio.estado === "procesando" && (
              <>
                <h1 className="font-display text-3xl font-extrabold text-teal-dark">
                  Estamos analizando tus fotos…
                </h1>
                <p className="mt-2 text-ink-soft">
                  Recarga esta página en unos segundos.
                </p>
              </>
            )}

            {estudio.estado === "error" && (
              <>
                <h1 className="font-display text-3xl font-extrabold text-teal-dark">
                  Algo no ha ido bien
                </h1>
                <p className="mt-2 text-ink-soft">
                  No hemos podido completar el análisis esta vez.
                </p>
                <Link
                  href="/analisis/nuevo"
                  className="mt-4 inline-block font-medium text-cyan-dark hover:text-teal-dark"
                >
                  Inténtalo de nuevo →
                </Link>
              </>
            )}

            {estudio.estado === "listo" && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-sage-ink shadow-sm">
                  ✓ Tu análisis está listo
                </span>
                <h1 className="mt-4 font-display text-4xl font-extrabold text-teal-dark">
                  Crea tu cuenta gratis para verlo
                </h1>
                <p className="mt-3 text-ink-soft">
                  Es gratis y tarda un minuto. Tu análisis quedará guardado en
                  tu perfil, listo para pedir presupuesto cuando quieras.
                </p>

                <div className="mt-8 flex flex-col items-center gap-3 md:items-start">
                  <Link
                    href={`/cuenta/registro?claim=${token}`}
                    className="rounded-full bg-gradient-to-r from-brand-green to-brand-blue px-8 py-4 font-display text-lg font-bold text-teal-dark shadow-lg transition hover:opacity-90"
                  >
                    Crear cuenta y ver mi análisis →
                  </Link>
                  <Link
                    href={`/cuenta/login?claim=${token}`}
                    className="font-medium text-cyan-dark hover:text-teal-dark"
                  >
                    Ya tengo cuenta — iniciar sesión
                  </Link>
                </div>
              </>
            )}
          </div>

          {estudio.estado === "listo" && (
            <div className="relative mx-auto hidden aspect-square w-full max-w-[220px] overflow-hidden rounded-3xl shadow-lg md:block">
              <Image
                src="/analisis/orientacion-frontal.png"
                alt=""
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
