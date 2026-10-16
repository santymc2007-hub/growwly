import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { verificarBaja } from "@/lib/email/baja";
import { confirmarBaja } from "./actions";

export const metadata: Metadata = {
  title: "Darse de baja de los emails",
  robots: { index: false, follow: false },
};

type SearchParams = { u?: string; tipo?: string; t?: string; estado?: string };

const NOMBRE_TIPO: Record<string, string> = {
  recordatorios: "los recordatorios",
  marketing: "las comunicaciones comerciales",
};

export default async function BajaEmailsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { u = "", tipo = "", t = "", estado } = await searchParams;
  const nombre = NOMBRE_TIPO[tipo] ?? "estos emails";
  const valido = estado ? false : verificarBaja(u, tipo, t);

  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-3xl border border-line bg-white p-8">
          {estado === "hecho" ? (
            <>
              <h1 className="font-display text-2xl text-teal-dark">Hecho</h1>
              <p className="mt-3 text-ink-soft">
                Ya no te enviaremos {nombre}. Los avisos sobre tus solicitudes
                (propuestas de clínicas y citas) te seguirán llegando, porque
                forman parte del servicio. Puedes cambiarlo cuando quieras en{" "}
                <Link href="/cuenta#emails" className="text-cyan-dark underline">
                  Mi cuenta
                </Link>
                .
              </p>
            </>
          ) : valido ? (
            <form action={confirmarBaja}>
              <input type="hidden" name="u" value={u} />
              <input type="hidden" name="tipo" value={tipo} />
              <input type="hidden" name="t" value={t} />
              <h1 className="font-display text-2xl text-teal-dark">Darte de baja</h1>
              <p className="mt-3 text-ink-soft">
                ¿Quieres dejar de recibir {nombre} de Growwly por email?
              </p>
              <button
                type="submit"
                className="press mt-6 rounded-full bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Sí, darme de baja
              </button>
            </form>
          ) : (
            <>
              <h1 className="font-display text-2xl text-teal-dark">Enlace no válido</h1>
              <p className="mt-3 text-ink-soft">
                Este enlace de baja no es válido o está incompleto. Puedes
                elegir qué emails recibes en{" "}
                <Link href="/cuenta#emails" className="text-cyan-dark underline">
                  Mi cuenta
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
