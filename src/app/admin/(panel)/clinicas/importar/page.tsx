import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Importador } from "./importador";

// Leer la web (Firecrawl) + Google y, al guardar, descargar y subir las
// fotos puede tardar bastante más que el límite por defecto.
export const maxDuration = 60;

type SearchParams = { clinica?: string };

export default async function ImportarClinicaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { clinica: clinicaId } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: municipios }, { data: clinica }] = await Promise.all([
    supabase.from("municipios").select("provincia, nombre").order("nombre"),
    clinicaId
      ? supabase.from("clinics").select("*").eq("id", clinicaId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="max-w-[1200px]">
      <Link
        href={clinica ? `/admin/clinicas/${clinica.id}/editar` : "/admin/clinicas"}
        className="text-sm font-medium text-cyan hover:text-cyan-dark"
      >
        ← {clinica ? "Volver a la ficha" : "Volver al listado"}
      </Link>
      <h1 className="mt-4 font-display text-2xl text-teal-dark">
        {clinica ? `Completar ${clinica.nombre} desde su web` : "Importar clínica desde su web"}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        {clinica
          ? "Se leen su web y su ficha de Google Maps. Solo se rellenan los campos que la ficha tenga vacíos y las fotos se añaden a las que ya tenga."
          : "Se leen su web y su ficha de Google Maps, revisas lo encontrado y se crea la ficha sin publicar. Después la terminas de pulir y la publicas desde el formulario de siempre."}
      </p>

      <div className="mt-6">
        <Importador clinica={clinica ?? null} municipios={municipios ?? []} />
      </div>
    </div>
  );
}
