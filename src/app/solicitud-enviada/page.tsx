import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type SearchParams = { clinica?: string; estado?: string };

/**
 * Destino del enlace de un solo uso de "enviarles mi solicitud" en el
 * email de clínicas alternativas — no hay pantalla intermedia de "mi
 * cuenta", el clic ya ha hecho el envío (ver
 * /api/solicitudes/reenviar/[token]).
 */
export default async function SolicitudEnviadaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { clinica, estado } = await searchParams;

  const esError = estado === "invalido" || estado === "error";

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        {esError ? (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-orange" aria-hidden />
            <h1 className="mt-4 font-display text-2xl text-teal-dark">
              Este enlace ya no es válido
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Puede que ya lo hayas usado antes, o que haya caducado. Si todavía
              necesitas ayuda, puedes buscar un centro desde el directorio.
            </p>
          </>
        ) : estado === "ya" ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-sage-ink" aria-hidden />
            <h1 className="mt-4 font-display text-2xl text-teal-dark">
              Ya le habías enviado tu solicitud a esta clínica
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              No hace falta que vuelvas a hacer nada — se pondrán en contacto contigo.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-sage-ink" aria-hidden />
            <h1 className="mt-4 font-display text-2xl text-teal-dark">
              ¡Solicitud enviada!
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              {clinica ? `${clinica} ha` : "La clínica ha"} recibido tu petición y se
              pondrá en contacto contigo pronto.
            </p>
          </>
        )}

        <Link
          href="/centros"
          className="press mt-6 inline-block rounded-full bg-teal-dark px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
        >
          Ver más centros
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
