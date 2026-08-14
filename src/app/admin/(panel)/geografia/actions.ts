"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function anadirMunicipio(formData: FormData) {
  const provincia = String(formData.get("provincia") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!provincia || !nombre) return;

  const supabase = createAdminClient();
  await supabase
    .from("municipios")
    .upsert({ provincia, nombre }, { onConflict: "provincia,nombre" });

  revalidatePath("/admin/geografia");
}

export async function quitarMunicipio(provincia: string, nombre: string) {
  const supabase = createAdminClient();
  await supabase.from("municipios").delete().eq("provincia", provincia).eq("nombre", nombre);
  revalidatePath("/admin/geografia");
}

export async function anadirZona(formData: FormData) {
  const municipio = String(formData.get("municipio") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!municipio || !nombre) return;

  const supabase = createAdminClient();
  await supabase
    .from("zonas")
    .upsert({ municipio, nombre }, { onConflict: "municipio,nombre" });

  revalidatePath("/admin/geografia");
}

export async function quitarZona(municipio: string, nombre: string) {
  const supabase = createAdminClient();
  await supabase.from("zonas").delete().eq("municipio", municipio).eq("nombre", nombre);
  revalidatePath("/admin/geografia");
}
