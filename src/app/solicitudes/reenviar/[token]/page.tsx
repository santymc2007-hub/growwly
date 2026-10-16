import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createAdminClient } from "@/lib/supabase/admin";
import { leerAlternativa } from "@/lib/leads/reenviar-alternativa";
import { confirmarReenvio } from "./actions";

export const metadata: Metadata = {
  title: "Enviar tu solicitud a otra clínica",
  robots: { index: false, follow: false },
};

type Params = { token: string };

/**
 * Pantalla a la que lleva "Enviarles mi solicitud" en el email de
 * clínicas alternativas. Abrirla no envía nada: el envío se hace al
 * pulsar el botón (ver lib/leads/reenviar-alternativa.ts).
 */
export default async function ConfirmarReenvioPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { token } = await params;
  const datos = await leerAlternativa(createAdminClient(), token);

  if (!datos) redirect("/solicitud-enviada?estado=invalido");
  if (datos.yaEnviada) redirect("/solicitud-enviada?estado=ya");

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-20">
        <form action={confirmarReenvio} className="rounded-3xl border border-line bg-white p-8">
          <input type="hidden" name="token" value={token} />
          <h1 className="font-display text-2xl text-teal-dark">
            Enviar tu solicitud a {datos.clinicaNombre}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Le mandaremos la misma solicitud que enviaste
            {datos.clinicaOriginalNombre ? ` a ${datos.clinicaOriginalNombre}` : ""}: tu
            nombre, teléfono, email y mensaje. La clínica se pondrá en contacto
            contigo.
          </p>
          <button
            type="submit"
            className="press mt-6 w-full rounded-full bg-teal-dark px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Sí, enviar mi solicitud
          </button>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
