import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import {
  CONDICIONES_DATOS,
  clinicaAceptoCondicionesDatos,
  destinoTrasCondiciones,
} from "@/lib/clinica/condiciones-datos";
import { aceptarCondicionesDatos } from "./actions";

export const metadata: Metadata = {
  title: "Datos de pacientes",
  robots: { index: false, follow: false },
};

type SearchParams = { clinic?: string; next?: string; error?: string };

/**
 * Paso obligatorio antes de ver solicitudes con datos de pacientes: la
 * clínica acepta ser responsable de esos datos. Ver
 * lib/clinica/condiciones-datos.ts.
 */
export default async function CondicionesDatosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { clinic, next = "", error } = await searchParams;
  const { clinicId: activa, clinicas } = await requireClinicaActiva();
  const clinicId = clinicas.some((c) => c.id === clinic) ? clinic! : activa;
  const nombre = clinicas.find((c) => c.id === clinicId)?.nombre ?? "tu clínica";

  if (await clinicaAceptoCondicionesDatos(createAdminClient(), clinicId)) {
    redirect(destinoTrasCondiciones(next));
  }

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-6 py-16">
        <form action={aceptarCondicionesDatos} className="rounded-3xl border border-line bg-white p-8">
          <input type="hidden" name="clinic" value={clinicId} />
          <input type="hidden" name="next" value={next} />
          <h1 className="font-display text-2xl text-teal-dark">Antes de ver tus solicitudes</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Las solicitudes incluyen datos personales y de salud de pacientes. Para
            verlas, {nombre} tiene que aceptar estas condiciones una sola vez:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink">
            {CONDICIONES_DATOS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          {error && (
            <p className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error" role="alert">
              Marca la casilla para continuar.
            </p>
          )}

          <label className="mt-6 flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" name="acepto" required className="mt-0.5" />
            <span>
              Acepto estas condiciones en nombre de {nombre}. Más información en la{" "}
              <a href="/legal/privacidad" target="_blank" rel="noopener" className="underline hover:text-teal-dark">
                Política de privacidad
              </a>
              .
            </span>
          </label>

          <button
            type="submit"
            className="press mt-6 w-full rounded-full bg-teal-dark px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Aceptar y ver solicitudes
          </button>
        </form>
      </div>
    </main>
  );
}
