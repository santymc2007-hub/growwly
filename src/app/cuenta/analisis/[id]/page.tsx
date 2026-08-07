import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { urlFirmadaFoto } from "@/lib/supabase/estudios-storage";
import { SiteHeader } from "@/components/site-header";
import { BorrarEstudioButton } from "./borrar-estudio-button";

type Params = { id: string };

export default async function ResultadoAnalisisPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const { data: estudio } = await supabase
    .from("estudios_capilares")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!estudio) {
    notFound();
  }

  // Las fotos viven en una carpeta por token de estudio, no por user_id,
  // así que para la URL firmada usamos el cliente admin (la comprobación
  // de que este estudio es suyo ya se hizo arriba).
  const fotoFrontalUrl = await urlFirmadaFoto(
    createAdminClient(),
    estudio.foto_frontal,
  );

  return (
    <main className="flex-1">
      <SiteHeader />

      <div className="mx-auto max-w-xl px-6 py-12">
        <Link
          href="/cuenta"
          className="text-sm font-medium text-cyan hover:text-cyan-dark"
        >
          ← Volver a mi cuenta
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <h1 className="font-display text-2xl text-teal-dark">
            Tu análisis orientativo
          </h1>
          <BorrarEstudioButton id={estudio.id} />
        </div>

        {estudio.estado === "procesando" && (
          <div className="mt-6 rounded-xl border border-line bg-white p-6 text-center">
            <p className="text-sm text-ink-soft">
              Todavía se está procesando. Recarga la página en unos segundos.
            </p>
          </div>
        )}

        {estudio.estado === "error" && (
          <div className="mt-6 rounded-xl border border-line bg-white p-6">
            <p className="text-sm text-error-dark">
              No hemos podido completar el análisis esta vez.
            </p>
            {estudio.error_detalle && (
              <p className="mt-2 rounded-lg bg-paper-dim px-3 py-2 text-xs text-ink-soft">
                {estudio.error_detalle}
              </p>
            )}
            <Link
              href="/analisis/nuevo"
              className="mt-3 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
            >
              Inténtalo de nuevo →
            </Link>
          </div>
        )}

        {estudio.estado === "listo" && (
          <div className="mt-6 flex flex-col gap-6">
            {fotoFrontalUrl && (
              <div className="relative aspect-square w-32 overflow-hidden rounded-xl border border-line bg-sage">
                <Image
                  src={fotoFrontalUrl}
                  alt="Tu foto frontal"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="rounded-xl border border-line bg-white p-5">
              {estudio.norwood_estimado && (
                <span className="inline-block rounded-full bg-sage px-3 py-1 text-xs font-medium text-sage-ink">
                  Estimación orientativa: {estudio.norwood_estimado}
                </span>
              )}
              <p className="mt-3 text-sm leading-relaxed text-ink">
                {estudio.resultado_texto}
              </p>
              <p className="mt-4 text-xs text-ink-soft">
                Esto es una primera impresión visual, no un diagnóstico
                médico. Solo un especialista, en consulta, puede valorar tu
                caso de verdad.
              </p>
            </div>

            {estudio.es_alopecia_tratable ? (
              <div className="rounded-xl bg-teal p-5 text-paper">
                <p className="font-display text-lg">¿Quieres presupuesto?</p>
                <p className="mt-1 text-sm text-paper/85">
                  Pide presupuesto directo a nuestras clínicas — tardas menos
                  de 2 minutos.
                </p>
                <Link
                  href="/cuenta/solicitud/nueva"
                  className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-teal-dark hover:bg-paper-dim"
                >
                  Pedir presupuesto →
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-white p-5">
                <p className="font-display text-lg text-teal-dark">
                  Clínicas que pueden orientarte
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Aunque no se aprecie un patrón claro de pérdida de cabello,
                  estas clínicas también atienden otras consultas capilares.
                </p>
                <Link
                  href="/clinicas"
                  className="mt-4 inline-block text-sm font-medium text-cyan hover:text-cyan-dark"
                >
                  Ver clínicas →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
