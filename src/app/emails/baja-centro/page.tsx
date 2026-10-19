import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { verificarBajaReclamo } from "@/lib/email/reclamo-centro";
import { confirmarBajaCentro } from "./actions";

export const metadata: Metadata = {
  title: "Baja de los emails de Growwly para centros",
  robots: { index: false, follow: false },
};

type SearchParams = { c?: string; t?: string; estado?: string };

/**
 * Baja de los avisos a centros sin cuenta. Abre una confirmación (no da
 * de baja al abrir el enlace: los antivirus de correo visitan enlaces).
 */
export default async function BajaCentroPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { c = "", t = "", estado } = await searchParams;
  const valido = estado ? false : verificarBajaReclamo(c, t);

  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-3xl border border-line bg-white p-8">
          {estado === "hecho" ? (
            <>
              <h1 className="font-display text-2xl text-teal-dark">Hecho</h1>
              <p className="mt-3 text-ink-soft">
                No os enviaremos más emails sobre vuestra ficha. Si además preferís que
                retiremos el centro del directorio, escribidnos a hola@growwly.es y lo
                hacemos.
              </p>
            </>
          ) : valido ? (
            <form action={confirmarBajaCentro}>
              <input type="hidden" name="c" value={c} />
              <input type="hidden" name="t" value={t} />
              <h1 className="font-display text-2xl text-teal-dark">Dejar de recibir emails</h1>
              <p className="mt-3 text-ink-soft">
                ¿Queréis dejar de recibir emails de Growwly sobre la ficha de vuestro centro?
              </p>
              <button
                type="submit"
                className="press mt-6 rounded-full bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Sí, no enviarnos más emails
              </button>
            </form>
          ) : (
            <>
              <h1 className="font-display text-2xl text-teal-dark">Enlace no válido</h1>
              <p className="mt-3 text-ink-soft">
                Este enlace no es válido o está incompleto. Escribidnos a hola@growwly.es y
                os damos de baja.
              </p>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
