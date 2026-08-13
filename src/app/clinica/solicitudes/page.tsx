import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { ClinicaNav } from "../clinica-nav";
import { requireClinicaActiva } from "@/lib/clinica/contexto-activo";
import { SelectorClinica } from "@/components/clinica/selector-clinica";

const ESTADO_LABEL: Record<string, string> = {
  enviado: "Nuevo",
  visto: "Visto",
  desbloqueado: "Desbloqueado",
};

export default async function SolicitudesClinicaPage() {
  const { clinicId, clinicas } = await requireClinicaActiva();

  const admin = createAdminClient();
  const { data: leads } = await admin
    .from("leads_clinica")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("enviado_en", { ascending: false });

  return (
    <main className="flex-1 bg-gradient-to-b from-sage/25 to-transparent">
      <SiteHeader />
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <SelectorClinica clinicas={clinicas} clinicaActivaId={clinicId} />

        <div className="mt-0">
          <ClinicaNav activo="solicitudes" />
        </div>

        <h2 className="font-display text-lg text-teal-dark">
          Solicitudes de presupuesto
        </h2>

        {leads && leads.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.token}`}
                  className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm hover:border-teal/40"
                >
                  <span className="text-ink">
                    {new Date(lead.enviado_en).toLocaleDateString("es-ES")}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      lead.estado === "enviado"
                        ? "bg-cyan text-white"
                        : "bg-paper-dim text-ink-soft"
                    }`}
                  >
                    {ESTADO_LABEL[lead.estado] ?? lead.estado}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Todavía no tienes solicitudes de presupuesto.
          </p>
        )}
      </div>
    </main>
  );
}
