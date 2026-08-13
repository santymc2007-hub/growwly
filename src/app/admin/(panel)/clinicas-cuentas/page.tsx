import { createAdminClient } from "@/lib/supabase/admin";
import { AprobarRechazarButtons } from "./botones";
import { GestorGrupo } from "./gestor-grupo";

export const dynamic = "force-dynamic";

export default async function ClinicasCuentasPage() {
  const supabase = createAdminClient();

  const { data: pendientes } = await supabase
    .from("profiles")
    .select("id, email, clinic_id, created_at")
    .eq("role", "clinic")
    .eq("clinic_status", "pendiente")
    .order("created_at", { ascending: true });

  const { data: aprobadas } = await supabase
    .from("profiles")
    .select("id, email, created_at")
    .eq("role", "clinic")
    .eq("clinic_status", "aprobado")
    .order("email", { ascending: true });

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

  const { data: todasLasClinicas } = await supabase
    .from("clinics")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  const profileIdsAprobados = (aprobadas ?? []).map((p) => p.id);
  const { data: miembros } =
    profileIdsAprobados.length > 0
      ? await supabase
          .from("clinic_members")
          .select("profile_id, clinic_id")
          .in("profile_id", profileIdsAprobados)
      : { data: [] };

  const clinicasPorProfile = new Map<string, { id: string; nombre: string }[]>();
  for (const m of miembros ?? []) {
    const nombre = todasLasClinicas?.find((c) => c.id === m.clinic_id)?.nombre;
    if (!nombre) continue;
    const lista = clinicasPorProfile.get(m.profile_id) ?? [];
    lista.push({ id: m.clinic_id, nombre });
    clinicasPorProfile.set(m.profile_id, lista);
  }

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

      <h2 className="mt-12 font-display text-xl text-teal-dark">
        Cuentas aprobadas y sus clínicas
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Añade más clínicas a una cuenta para formar un grupo — esa
        persona podrá cambiar entre todas ellas desde su panel.
      </p>

      {aprobadas && aprobadas.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-dim text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Cuenta</th>
                <th className="px-4 py-3 font-medium">Clínicas vinculadas</th>
              </tr>
            </thead>
            <tbody>
              {aprobadas.map((p) => (
                <tr key={p.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 text-ink-soft">{p.email}</td>
                  <td className="px-4 py-3">
                    <GestorGrupo
                      profileId={p.id}
                      vinculadas={clinicasPorProfile.get(p.id) ?? []}
                      todasLasClinicas={todasLasClinicas ?? []}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-soft">
          Todavía no hay ninguna cuenta de clínica aprobada.
        </p>
      )}
    </div>
  );
}
