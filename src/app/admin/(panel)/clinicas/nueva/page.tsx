import Link from "next/link";
import { ClinicForm } from "../clinic-form";
import { createClinic } from "../actions";

type SearchParams = { error?: string };

export default async function NuevaClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

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
        <ClinicForm action={createClinic} error={error} />
      </div>
    </div>
  );
}
