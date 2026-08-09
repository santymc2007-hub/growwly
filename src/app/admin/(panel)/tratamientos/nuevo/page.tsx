import { createTratamiento } from "../actions";
import { TratamientoForm } from "../tratamiento-form";

type SearchParams = { error?: string };

export default async function NuevoTratamientoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">
        Nuevo tratamiento
      </h1>
      <div className="mt-6">
        <TratamientoForm action={createTratamiento} error={error} />
      </div>
    </div>
  );
}
