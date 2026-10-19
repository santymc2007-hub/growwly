import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FondoTextura } from "@/components/fondo-textura";
import { TrackOnceParam } from "@/components/analytics/track-once-param";
import { SellosConfianza } from "@/components/analisis/sellos-confianza";
import { CONTENIDO_FLUJOS } from "@/lib/informe/flujos";
import { FLUJOS, type InformeCapilar } from "@/lib/informe/tipos";
import { DesbloquearValoracion } from "./desbloquear-valoracion";

type Params = { token: string };

/** Lo que se enseña gratis antes de pedir el email: el patrón y el grado. */
function adelantoDeInforme(informe: unknown): { etiqueta: string; valor: string }[] {
  const ia = informe as InformeCapilar | null;
  if (!ia || !FLUJOS.includes(ia.flujo) || !ia.grado) return [];
  const contenido = CONTENIDO_FLUJOS[ia.flujo];
  const resultado = contenido.escala.resultado(ia);
  const prefijo = "Tu grado estimado: ";
  return [
    { etiqueta: "Lo que vemos", valor: contenido.etiqueta },
    resultado.startsWith(prefijo)
      ? { etiqueta: "Grado estimado", valor: resultado.slice(prefijo.length) }
      : { etiqueta: contenido.escala.nombre, valor: resultado },
  ];
}

// Lo que queda desenfocado: solo los títulos de lo que trae la
// valoración completa, sin valores (no se inventa nada que no sea suyo).
// Growwly cubre cualquier problema capilar: las unidades foliculares solo
// aparecen cuando el caso apunta a injerto.
function bloqueadoDeInforme(informe: unknown): string[] {
  const ia = informe as InformeCapilar | null;
  const injerto =
    ia?.flujo === "alopecia_androgenetica_masculina" && ia.candidato_injerto !== "no";
  return [
    "Qué significa en tu caso",
    "Tratamientos que encajan contigo",
    ...(injerto ? ["Unidades foliculares estimadas"] : []),
    "Qué esperar",
    "Sugerencias para ti",
    "Próximos pasos",
  ];
}

export default async function AnalisisPendientePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: estudio } = await supabase
    .from("estudios_capilares")
    .select("id, user_id, estado, informe, email_contacto, nombre_contacto")
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

  const adelanto = adelantoDeInforme(estudio.informe);
  const bloqueado = bloqueadoDeInforme(estudio.informe);

  return (
    <main className="relative flex-1">
      <FondoTextura />
      <TrackOnceParam param="enviado" evento="analisis_completado" />
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-3 pb-10 pt-8 sm:px-6 sm:pt-12">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {estudio.estado === "listo" ? (
            <>
              <div className="grid items-center md:grid-cols-[1fr_1.1fr]">
                <div className="px-6 pb-2 pt-8 sm:px-10 sm:pt-12 md:py-14">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-4 py-1.5 text-sm font-medium text-sage-ink">
                    ✓ ¡Enhorabuena! Tu valoración está lista
                  </span>
                  <h1 className="mt-4 max-w-md font-display text-3xl font-extrabold text-teal-dark sm:text-4xl">
                    Crea una cuenta totalmente{" "}
                    <span className="underline decoration-2 underline-offset-2">GRATIS</span> y
                    desbloquea tu valoración
                  </h1>
                  <p className="mt-3 max-w-md text-ink-soft">
                    Tardarás menos de 1 minuto. Tu valoración quedará guardada en tu perfil,
                    preparada para solicitar presupuesto.
                  </p>
                </div>

                <div className="relative hidden aspect-[917/608] w-full md:block">
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

              {/* Móvil: adelanto → formulario → lo bloqueado (el formulario
                  queda arriba). Escritorio: adelanto y bloqueado a la
                  izquierda, formulario a la derecha. */}
              <div className="flex flex-col gap-6 px-6 pb-8 pt-4 sm:px-10 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-4 lg:pt-6">
                {adelanto.length > 0 && (
                  <div data-clarity-mask="true" className="grid grid-cols-2 gap-2.5 lg:col-start-1 lg:row-start-1 lg:gap-3">
                    {adelanto.map((fila) => (
                      <div key={fila.etiqueta} className="flex flex-col gap-0.5 rounded-xl border border-line px-3.5 py-2.5 sm:px-4 sm:py-3">
                        <span className="text-xs text-ink-soft">{fila.etiqueta}</span>
                        <span className="text-sm font-semibold leading-snug text-teal-dark sm:text-base">
                          {fila.valor}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <section aria-label="Crea tu cuenta" className="rounded-3xl bg-paper-dim p-6 sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
                  <DesbloquearValoracion
                    token={token}
                    emailInicial={estudio.email_contacto}
                    nombreInicial={estudio.nombre_contacto}
                  />
                  <p className="mt-4 text-center text-sm text-ink-soft">
                    ¿Ya tienes cuenta?{" "}
                    <Link href={`/cuenta/login?claim=${token}`} className="font-medium text-cyan-dark hover:text-teal-dark">
                      Inicia sesión
                    </Link>
                  </p>
                </section>

                <section aria-label="Lo que incluye tu valoración completa" className="flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-start-2">
                  <div className="relative overflow-hidden rounded-2xl bg-paper-dim">
                    <div aria-hidden className="grid select-none gap-x-8 gap-y-4 p-5 blur-[5px] sm:grid-cols-2 sm:p-6">
                      {bloqueado.map((titulo) => (
                        <div key={titulo} className="flex items-center justify-between gap-4">
                          <span className="text-sm">{titulo}</span>
                          <span className="h-3 w-20 rounded-full bg-teal-dark/40" />
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-center text-sm font-semibold text-teal-dark shadow-md shadow-teal-dark/10 sm:text-[15px]">
                        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="11" width="16" height="10" rx="2" />
                          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                        </svg>
                        Tratamientos, qué esperar y sugerencias
                      </span>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-ink-soft sm:text-[13px]">
                    Valoración orientativa con IA a partir de tus fotos. No es un diagnóstico médico.
                  </p>
                </section>
              </div>

              <div className="px-6 pb-8 sm:px-10">
                <SellosConfianza />
              </div>
            </>
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
