"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIAS_VENTAJA } from "@/lib/clinica/comparables";

const ESTADOS = ["aprobada", "propuesta", "descartada", "archivada"];

function volver(msg: string, ok = true): never {
  redirect(`/admin/valores?${ok ? "ok" : "error"}=${encodeURIComponent(msg)}`);
}

function categoria(v: FormDataEntryValue | null) {
  const s = String(v ?? "");
  return CATEGORIAS_VENTAJA.some((c) => c.valor === s) ? s : "otros";
}

function refrescar() {
  revalidatePath("/admin/valores");
  revalidatePath("/clinica");
  revalidatePath("/centros", "layout");
}

/** Guarda nombre, categoría, destacada y estado de un valor. */
export async function guardarValor(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 80);
  const estado = String(formData.get("estado") ?? "aprobada");
  if (!id || !nombre || !ESTADOS.includes(estado)) volver("Faltan datos.", false);

  const { error } = await createAdminClient()
    .from("ventajas")
    .update({
      nombre,
      categoria: categoria(formData.get("categoria")),
      destacada: formData.get("destacada") === "on",
      estado,
    })
    .eq("id", id);
  if (error) volver(error.message, false);
  refrescar();
  volver(estado === "aprobada" ? `«${nombre}» guardado.` : `«${nombre}» ${estado}.`);
}

/**
 * Fusiona una propuesta (o un valor duplicado) con otro que ya existe:
 * las clínicas que lo tenían marcado pasan a tener el de destino.
 */
export async function fusionarValor(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const destino = String(formData.get("destino") ?? "");
  if (!id || !destino || id === destino) volver("Elige con qué valor fusionarlo.", false);

  const admin = createAdminClient();
  const { data: marcas } = await admin.from("clinic_ventajas").select("clinic_id").eq("ventaja_id", id);
  if (marcas?.length) {
    await admin.from("clinic_ventajas").upsert(
      marcas.map((m) => ({ clinic_id: m.clinic_id, ventaja_id: destino })),
      { onConflict: "clinic_id,ventaja_id", ignoreDuplicates: true },
    );
  }
  await admin.from("clinic_ventajas").delete().eq("ventaja_id", id);
  await admin.from("ventajas").update({ estado: "descartada" }).eq("id", id);
  refrescar();
  volver("Fusionado.");
}

export async function crearValor(formData: FormData) {
  await requireAdmin();
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 80);
  if (!nombre) volver("Escribe el nombre.", false);
  const { error } = await createAdminClient().from("ventajas").insert({
    nombre,
    categoria: categoria(formData.get("categoria")),
    destacada: formData.get("destacada") === "on",
    estado: "aprobada",
  });
  if (error) volver(error.message, false);
  refrescar();
  volver(`«${nombre}» añadido. Ya lo pueden marcar todas las clínicas.`);
}
