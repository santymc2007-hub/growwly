import { createAdminClient } from "@/lib/supabase/admin";

export async function getMunicipiosYZonas() {
  const supabase = createAdminClient();
  const [{ data: municipios }, { data: zonas }] = await Promise.all([
    supabase.from("municipios").select("provincia, nombre").order("nombre"),
    supabase.from("zonas").select("municipio, nombre").order("nombre"),
  ]);
  return {
    municipios: municipios ?? [],
    zonas: zonas ?? [],
  };
}
