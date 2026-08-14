import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClinicForm } from "../../clinic-form";
import { updateClinic } from "../../actions";
import { getMunicipiosYZonas } from "@/lib/clinica/geografia";

type Params = { id: string };
type SearchParams = { error?: string };

export default async function EditarClinicaPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

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
  const updateThisClinic = updateClinic.bind(null, clinic.id);

  return (
    <div>
      <Link
        href="/admin/clinicas"
        className="text-sm font-medium text-cyan hover:text-cyan-dark"
      >
        ← Volver al listado
      </Link>
      <h1 className="mt-4 font-display text-2xl text-teal-dark">
        Editar {clinic.nombre}
      </h1>

      <div className="mt-6">
        <ClinicForm
          action={updateThisClinic}
          clinic={clinic}
          error={error}
          municipios={municipios}
          zonas={zonas}
        />
      </div>
    </div>
  );
}
