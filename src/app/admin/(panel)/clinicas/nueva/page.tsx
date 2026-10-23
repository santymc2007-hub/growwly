import Link from "next/link";
import { ClinicForm } from "../clinic-form";
import { createClinic } from "../actions";
import { getMunicipiosYZonas } from "@/lib/clinica/geografia";
import { createAdminClient } from "@/lib/supabase/admin";
import { leerComparablesFicha } from "@/lib/clinica/comparables-servidor";

// Subir fotos/logo a Supabase Storage desde la Server Action puede
// tardar más que el límite por defecto en alguna conexión lenta.
export const maxDuration = 60;

type SearchParams = { error?: string };

export default async function NuevaClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;
  const { municipios, zonas } = await getMunicipiosYZonas();
  const comparables = await leerComparablesFicha(createAdminClient(), null);

  return (
    <div>
      <Link
        href="/admin/clinicas"
        className="text-sm font-medium text-cyan hover:text-cyan-dark"
      >
        ← Volver al listado
      </Link>
      <h1 className="mt-4 font-display text-2xl text-teal-dark">
        Añadir clínica
      </h1>

      <div className="mt-6">
        <ClinicForm
          action={createClinic}
          error={error}
          municipios={municipios}
          zonas={zonas}
          comparables={comparables}
        />
      </div>
    </div>
  );
}
