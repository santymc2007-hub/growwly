"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { borrarFotosEstudio } from "@/lib/supabase/estudios-storage";

export async function borrarEstudio(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  const { data: estudio } = await supabase
    .from("estudios_capilares")
    .select(
      "foto_frontal, foto_donante, foto_coronilla, foto_perfil_derecho, foto_perfil_izquierdo, fotos_adicionales",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase
    .from("estudios_capilares")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (estudio) {
    // Las fotos viven en una carpeta por token de estudio, no por
    // user_id, así que el borrado necesita el cliente admin.
    await borrarFotosEstudio(createAdminClient(), [
      estudio.foto_frontal,
      estudio.foto_donante,
      estudio.foto_coronilla,
      estudio.foto_perfil_derecho,
      estudio.foto_perfil_izquierdo,
      ...estudio.fotos_adicionales,
    ]);
  }

  revalidatePath("/cuenta");
  redirect("/cuenta");
}
