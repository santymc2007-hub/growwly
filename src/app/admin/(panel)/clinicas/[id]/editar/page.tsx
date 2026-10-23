import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClinicForm } from "../../clinic-form";
import { updateClinic } from "../../actions";
import { getMunicipiosYZonas } from "@/lib/clinica/geografia";
import { createAdminClient } from "@/lib/supabase/admin";
import { leerComparablesFicha } from "@/lib/clinica/comparables-servidor";

// Subir fotos/logo a Supabase Storage desde la Server Action puede
// tardar más que el límite por defecto en alguna conexión lenta.
export const maxDuration = 60;

type Params = { id: string };
type SearchParams = { error?: string; guardado?: string };

export default async function EditarClinicaPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { error, guardado } = await searchParams;

  const supabase = await createClient();
  const { data: clinic } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!clinic) {
    notFound();
  }

  const { municipios, zonas } = await getMunicipiosYZonas();
  const comparables = await leerComparablesFicha(createAdminClient(), clinic.id);
  const updateThisClinic = updateClinic.bind(null, clinic.id);

  return (
    <div>
      <Link
        href="/admin/clinicas"
        className="text-sm font-medium text-cyan hover:text-cyan-dark"
      >
        ← Volver al listado
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-teal-dark">Editar {clinic.nombre}</h1>
        <Link
          href={`/admin/clinicas/importar?clinica=${clinic.id}`}
          className="rounded-lg border border-teal px-4 py-2 text-sm font-medium text-teal hover:bg-sage/40"
        >
          Completar desde su web
        </Link>
      </div>

      <div className="mt-6">
        <ClinicForm
          action={updateThisClinic}
          clinic={clinic}
          error={error}
          guardado={guardado === "1"}
          municipios={municipios}
          zonas={zonas}
          comparables={comparables}
        />
      </div>
    </div>
  );
}
