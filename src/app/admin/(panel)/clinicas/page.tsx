import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteClinicButton } from "./delete-button";
import { OrderControls } from "./order-controls";
import { VerifiedBadge } from "@/components/clinics/verified-badge";
import { AdminClinicFilters } from "./admin-clinic-filters";

type SearchParams = {
  error?: string;
  q?: string;
  ciudad?: string;
  estado?: string;
  publicado?: string;
};

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}

export default async function AdminClinicasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, q, ciudad, estado, publicado } = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase
    .from("clinics")
    .select("*")
    .order("destacado", { ascending: false })
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  const clinicas = data ?? [];

  const ciudades = uniqueSorted(clinicas.map((c) => c.ciudad));

  const clinicasFiltradas = clinicas.filter((c) => {
    if (q && !c.nombre.toLowerCase().includes(q.toLowerCase())) return false;
    if (ciudad && c.ciudad !== ciudad) return false;
    if (estado === "verificada" && !c.verificado) return false;
    if (estado === "pendiente" && c.verificado) return false;
    if (publicado === "si" && !c.publicado) return false;
    if (publicado === "no" && c.publicado) return false;
    return true;
  });

  // El orden/destacado es un concepto global (afecta al listado público
  // completo), así que se calcula sobre TODAS las clínicas, no solo las
  // que estén visibles tras filtrar.
  function groupPosition(id: string, destacado: boolean) {
    const group = clinicas.filter((c) => c.destacado === destacado);
    const idx = group.findIndex((c) => c.id === id);
    return { isFirst: idx === 0, isLast: idx === group.length - 1 };
  }

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
            {clinicasFiltradas.length} de {clinicas.length}{" "}
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

      <AdminClinicFilters ciudades={ciudades} />

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-dim text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Ciudad</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Actualizado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clinicasFiltradas.map((clinic) => {
              const { isFirst, isLast } = groupPosition(
                clinic.id,
                clinic.destacado,
              );
              return (
                <tr
                  key={clinic.id}
                  className={`border-t border-line ${
                    !clinic.publicado ? "bg-error/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <OrderControls
                      id={clinic.id}
                      destacado={clinic.destacado}
                      isFirst={isFirst}
                      isLast={isLast}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {clinic.nombre}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {clinic.ciudad ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {clinic.verificado ? (
                        <VerifiedBadge />
                      ) : (
                        <span className="rounded-full bg-paper-dim px-2.5 py-1 text-xs font-medium text-ink-soft">
                          Pendiente
                        </span>
                      )}
                      {!clinic.publicado && (
                        <span className="rounded-full bg-error/15 px-2.5 py-1 text-xs font-medium text-error-dark">
                          De baja
                        </span>
                      )}
                    </div>
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
              );
            })}
          </tbody>
        </table>
        {clinicasFiltradas.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            Ninguna clínica coincide con estos filtros.
          </p>
        )}
      </div>
    </div>
  );
}
