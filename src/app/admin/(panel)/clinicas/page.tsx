import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminClinicFilters } from "./admin-clinic-filters";
import { ClinicsTable, type ClinicRow } from "./clinics-table";

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

      <ClinicsTable
        rows={clinicasFiltradas.map(
          (clinic): ClinicRow => ({
            ...clinic,
            ...groupPosition(clinic.id, clinic.destacado),
          }),
        )}
      />
    </div>
  );
}
