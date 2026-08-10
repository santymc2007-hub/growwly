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

        {estudio.estado === "listo" ? (
          <div className="mx-auto grid max-w-[1600px] items-center gap-6 px-6 py-10 md:grid-cols-[1fr_1.1fr] md:py-16">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-sage-ink shadow-sm">
                ✓ Tu análisis está listo
              </span>
              <h1 className="mt-4 font-display text-3xl font-extrabold text-teal-dark sm:text-4xl">
                Crea tu cuenta gratis para verlo
              </h1>
              <p className="mt-3 max-w-sm text-ink-soft">
                Es gratis y tarda un minuto. Tu análisis quedará guardado en
                tu perfil, listo para pedir presupuesto cuando quieras.
              </p>

              <div className="mt-8 flex flex-col items-start gap-3">
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
            </div>

            <div className="relative -mx-6 aspect-[1400/905] w-full md:mx-0 md:max-w-none">
              <Image
                src="/analisis/pareja-analisis-listo.png"
                alt=""
                fill
                sizes="(min-width: 768px) 800px, 100vw"
                className="object-contain object-bottom"
                priority
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md px-6 py-16 text-center">
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
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
