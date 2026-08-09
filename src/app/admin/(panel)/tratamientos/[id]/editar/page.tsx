import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateTratamiento } from "../../actions";
import { TratamientoForm } from "../../tratamiento-form";

type Params = { id: string };
type SearchParams = { error?: string };

export default async function EditarTratamientoPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: tratamiento } = await supabase
    .from("tratamientos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tratamiento) {
    notFound();
  }

  const actionConId = updateTratamiento.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl text-teal-dark">
        Editar tratamiento
      </h1>
      <div className="mt-6">
        <TratamientoForm action={actionConId} tratamiento={tratamiento} error={error} />
      </div>
    </div>
  );
}
