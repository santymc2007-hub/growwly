import { createAdminClient } from "@/lib/supabase/admin";

const ESTADO_LABEL: Record<string, string> = {
  enviado: "Enviado",
  visto: "Visto",
  desbloqueado: "Desbloqueado",
};

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const supabase = createAdminClient();

  const { data: leads } = await supabase
    .from("leads_clinica")
    .select("*")
    .order("enviado_en", { ascending: false });

  const clinicIds = Array.from(new Set((leads ?? []).map((l) => l.clinic_id)));
  const { data: clinicas } =
    clinicIds.length > 0
      ? await supabase.from("clinics").select("id, nombre").in("id", clinicIds)
      : { data: [] };
  const nombrePorClinicId = new Map((clinicas ?? []).map((c) => [c.id, c.nombre]));

  const desbloqueados = (leads ?? []).filter((l) => l.estado === "desbloqueado");

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">Leads</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {desbloqueados.length} desbloqueados de {(leads ?? []).length} enviados
        en total — factura estos a mano por ahora, según lo acordado con cada
        clínica.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-dim text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Clínica</th>
              <th className="px-4 py-3 font-medium">Enviado</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Desbloqueado</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((lead) => (
              <tr key={lead.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-ink">
                  {nombrePorClinicId.get(lead.clinic_id) ?? "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {new Date(lead.enviado_en).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      lead.estado === "desbloqueado"
                        ? "bg-sage text-sage-ink"
                        : "bg-paper-dim text-ink-soft"
                    }`}
                  >
                    {ESTADO_LABEL[lead.estado] ?? lead.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {lead.desbloqueado_en
                    ? new Date(lead.desbloqueado_en).toLocaleDateString("es-ES")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(leads ?? []).length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            Todavía no se ha enviado ningún lead a ninguna clínica.
          </p>
        )}
      </div>
    </div>
  );
}
