import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FondoTextura } from "@/components/fondo-textura";

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
    <main className="relative flex-1">
      <FondoTextura />
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-3 pb-10 pt-8 sm:px-6 sm:pt-12">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {estudio.estado === "listo" ? (
            <div className="grid items-center gap-6 md:grid-cols-[1fr_1.1fr]">
              <div className="px-6 py-10 sm:px-10 sm:py-14 md:py-16">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-4 py-1.5 text-sm font-medium text-sage-ink">
                  ✓ ¡Enhorabuena! Tu análisis está listo
                </span>
                <h1 className="mt-4 max-w-sm font-display text-3xl font-extrabold text-teal-dark sm:text-4xl">
                  Crea una cuenta totalmente{" "}
                  <span className="underline decoration-2 underline-offset-2">
                    GRATIS
                  </span>{" "}
                  y desbloquea tu valoración
                </h1>
                <p className="mt-3 max-w-sm text-ink-soft">
                  Tardarás menos de 1 minuto. Tu valoración quedará guardada en
                  tu perfil, preparada para solicitar presupuesto.
                </p>

                <div className="mt-8 flex flex-col items-start gap-3">
                  <Link
                    href={`/cuenta/registro?claim=${token}`}
                    className="press rounded-full bg-yellow px-8 py-4 font-display text-lg font-bold text-teal-dark shadow-lg shadow-yellow/30 transition hover:opacity-90"
                  >
                    Crear nueva cuenta →
                  </Link>
                  <Link
                    href={`/cuenta/login?claim=${token}`}
                    className="font-medium text-cyan-dark hover:text-teal-dark"
                  >
                    Ya tengo cuenta — iniciar sesión
                  </Link>
                </div>
              </div>

              <div className="relative aspect-[917/608] w-full">
                <Image
                  src="/analisis/pareja-celebrando.webp"
                  alt=""
                  fill
                  sizes="(min-width: 768px) 800px, 100vw"
                  className="object-cover"
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
      </div>
      <SiteFooter />
    </main>
  );
}
