import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MOTIVOS_DENUNCIA } from "./motivos";
import { enviarDenuncia } from "./actions";

export const metadata: Metadata = {
  title: "Denunciar un contenido",
  robots: { index: false, follow: false },
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30";
const labelClass = "text-sm font-medium text-ink";

type SearchParams = { url?: string; error?: string; enviada?: string; ref?: string };

/**
 * Mecanismo de notificación del Reglamento de Servicios Digitales
 * (art. 16). Enlazado desde el pie de todas las páginas y desde cada
 * ficha de clínica (con la ficha ya rellena).
 */
export default async function DenunciarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { url = "", error, enviada, ref } = await searchParams;

  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-3xl border border-line bg-white p-8">
          {enviada ? (
            <>
              <h1 className="font-display text-2xl text-teal-dark">Denuncia recibida</h1>
              <p className="mt-3 text-ink-soft">
                Gracias por avisarnos. Te hemos enviado un email de confirmación
                {ref ? ` con la referencia ${ref}` : ""}. Revisaremos el contenido
                y te escribiremos con lo que decidamos y por qué.
              </p>
              <Link
                href="/"
                className="press mt-6 inline-block rounded-full bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Volver a Growwly
              </Link>
            </>
          ) : (
            <form action={enviarDenuncia} className="flex flex-col gap-5">
              <div>
                <h1 className="font-display text-2xl text-teal-dark">Denunciar un contenido</h1>
                <p className="mt-2 text-sm text-ink-soft">
                  Si algo de Growwly te parece falso o ilegal (una ficha, una
                  reseña, una foto o un texto), cuéntanoslo. Lo revisaremos y te
                  responderemos.
                </p>
              </div>

              {error && (
                <p className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error" role="alert">
                  {error}
                </p>
              )}

              <div>
                <label htmlFor="url" className={labelClass}>
                  Página o contenido
                </label>
                <input
                  id="url"
                  name="url"
                  required
                  maxLength={500}
                  defaultValue={url}
                  placeholder="Enlace de la página o nombre de la clínica"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="motivo" className={labelClass}>
                  Motivo
                </label>
                <select id="motivo" name="motivo" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Elige un motivo
                  </option>
                  {Object.entries(MOTIVOS_DENUNCIA).map(([valor, texto]) => (
                    <option key={valor} value={valor}>
                      {texto}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="explicacion" className={labelClass}>
                  Por qué es falso o ilegal
                </label>
                <textarea
                  id="explicacion"
                  name="explicacion"
                  required
                  minLength={10}
                  maxLength={4000}
                  rows={5}
                  placeholder="Indica qué parte exacta y por qué. Si eres la persona afectada o el titular de los derechos, dilo."
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nombre" className={labelClass}>
                    Tu nombre
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    required
                    maxLength={200}
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Tu email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={320}
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Campo trampa para bots: oculto a personas y lectores de pantalla. */}
              <div aria-hidden className="hidden">
                <label>
                  Web
                  <input name="web" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <label className="flex items-start gap-2 text-sm text-ink">
                <input type="checkbox" name="buena_fe" required className="mt-0.5" />
                <span>
                  Declaro de buena fe que la información de esta denuncia es
                  correcta y completa.
                </span>
              </label>

              <p className="text-xs text-ink-soft">
                Usaremos tu nombre y email solo para tramitar la denuncia y
                responderte. Más información en la{" "}
                <Link href="/legal/privacidad" className="underline hover:text-teal-dark">
                  Política de privacidad
                </Link>
                .
              </p>

              <button
                type="submit"
                className="press self-start rounded-full bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Enviar denuncia
              </button>
            </form>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
