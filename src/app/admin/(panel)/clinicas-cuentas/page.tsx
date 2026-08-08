import { createAdminClient } from "@/lib/supabase/admin";
import { AprobarRechazarButtons } from "./botones";

export const dynamic = "force-dynamic";

export default async function ClinicasCuentasPage() {
  const supabase = createAdminClient();

  const { data: pendientes } = await supabase
    .from("profiles")
    .select("id, email, clinic_id, created_at")
    .eq("role", "clinic")
    .eq("clinic_status", "pendiente")
    .order("created_at", { ascending: true });

  const clinicIds = (pendientes ?? [])
    .map((p) => p.clinic_id)
    .filter((id): id is string => Boolean(id));

  const { data: clinicasRelacionadas } =
    clinicIds.length > 0
      ? await supabase.from("clinics").select("id, nombre").in("id", clinicIds)
      : { data: [] };

  const nombrePorClinicId = new Map(
    (clinicasRelacionadas ?? []).map((c) => [c.id, c.nombre]),
  );

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">
        Cuentas de clínica pendientes
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Confirma que quien se ha registrado representa de verdad a esa
        clínica antes de aprobarla.
      </p>

      {pendientes && pendientes.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-dim text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Clínica</th>
                <th className="px-4 py-3 font-medium">Email de la cuenta</th>
                <th className="px-4 py-3 font-medium">Solicitado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-ink">
                    {p.clinic_id
                      ? (nombrePorClinicId.get(p.clinic_id) ?? "—")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{p.email}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {new Date(p.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AprobarRechazarButtons profileId={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-soft">
          No hay solicitudes pendientes ahora mismo.
        </p>
      )}
    </div>
  );
}
