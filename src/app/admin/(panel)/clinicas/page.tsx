import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteClinicButton } from "./delete-button";
import { VerifiedBadge } from "@/components/clinics/verified-badge";

type SearchParams = { error?: string };

export default async function AdminClinicasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .order("updated_at", { ascending: false });
  const clinicas = data ?? [];

  return (
    <div>
      {error && (
        <p className="mb-6 rounded-lg bg-error/10 px-4 py-3 text-sm text-error-dark">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-teal-dark">Clínicas</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {clinicas.length}{" "}
            {clinicas.length === 1 ? "clínica registrada" : "clínicas registradas"}
          </p>
        </div>
        <Link
          href="/admin/clinicas/nueva"
          className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-dark"
        >
          + Añadir clínica
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-dim text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Ciudad</th>
              <th className="px-4 py-3 font-medium">Verificada</th>
              <th className="px-4 py-3 font-medium">Actualizado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clinicas.map((clinic) => (
              <tr key={clinic.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-ink">
                  {clinic.nombre}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {clinic.ciudad ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {clinic.verificado ? (
                    <VerifiedBadge />
                  ) : (
                    <span className="rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-ink-soft">
                      Pendiente
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {new Date(clinic.updated_at).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/admin/clinicas/${clinic.id}/editar`}
                      className="font-medium text-cyan hover:text-cyan-dark"
                    >
                      Editar
                    </Link>
                    <DeleteClinicButton id={clinic.id} nombre={clinic.nombre} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
