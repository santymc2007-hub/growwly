import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { InterruptorVisibilidad } from "./interruptor-visibilidad";
import { FiltroCiudad } from "./filtro-ciudad";
import type { TipoVisibilidad } from "./actions";
import type { Clinic } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

// Cada columna que demos de alta aquí aparece sola en la tabla — para
// añadir un nuevo tipo de visibilidad en el futuro, basta con añadir
// una entrada más a esta lista.
const COLUMNAS: {
  tipo: TipoVisibilidad;
  titulo: string;
  activo: (c: Clinic) => boolean;
  solicitado: (c: Clinic) => boolean;
}[] = [
  {
    tipo: "destacado",
    titulo: "Destacado provincia",
    activo: (c) => c.destacado,
    solicitado: (c) => c.destacado_solicitado,
  },
  {
    tipo: "destacado_home",
    titulo: "Destacado Home",
    activo: (c) => c.destacado_home,
    solicitado: (c) => c.destacado_home_solicitado,
  },
  {
    tipo: "destacado_ciudad",
    titulo: "Destacado ciudad",
    activo: (c) => c.destacado_ciudad,
    solicitado: (c) => c.destacado_ciudad_solicitado,
  },
  {
    tipo: "premium",
    titulo: "Premium",
    activo: (c) => c.plan === "premium",
    solicitado: (c) => Boolean(c.plan_solicitado),
  },
];

type SearchParams = { ciudad?: string };

export default async function VisibilidadPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { ciudad } = await searchParams;

  const supabase = createAdminClient();
  let query = supabase
    .from("clinics")
    .select("*")
    .order("nombre", { ascending: true });

  if (ciudad) {
    query = query.eq("ciudad", ciudad);
  }

  const { data: clinicas } = await query;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-teal-dark">Visibilidad</h1>
          <p className="mt-1 text-sm text-ink-soft">
            <span className="mr-3 inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" /> Activo
            </span>
            <span className="mr-3 inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange" /> Solicitado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-line" /> Inactivo
            </span>
          </p>
        </div>

        <FiltroCiudad ciudadActual={ciudad ?? ""} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper-dim text-left">
              <th className="px-4 py-3 font-medium text-ink">Clínica</th>
              {COLUMNAS.map((col) => (
                <th key={col.tipo} className="px-4 py-3 font-medium text-ink">
                  {col.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(clinicas ?? []).map((clinic) => (
              <tr key={clinic.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clinicas/${clinic.id}/editar`}
                    className="font-medium text-ink hover:text-teal"
                  >
                    {clinic.nombre}
                  </Link>
                  {clinic.ciudad && (
                    <p className="text-xs text-ink-soft">{clinic.ciudad}</p>
                  )}
                </td>
                {COLUMNAS.map((col) => {
                  const estado = col.solicitado(clinic)
                    ? "solicitado"
                    : col.activo(clinic)
                      ? "activo"
                      : "inactivo";
                  return (
                    <td key={col.tipo} className="px-4 py-3">
                      <InterruptorVisibilidad
                        clinicId={clinic.id}
                        tipo={col.tipo}
                        estado={estado}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {(clinicas ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-ink-soft">
            No hay clínicas para ese filtro.
          </p>
        )}
      </div>
    </div>
  );
}
