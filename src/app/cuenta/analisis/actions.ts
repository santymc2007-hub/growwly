"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { borrarFotosEstudio, subirFotoEstudio } from "@/lib/supabase/estudios-storage";
import { analizarFotosCapilares } from "@/lib/ai/analizar-fotos";
import { leerInforme } from "@/lib/informe/sanear";
import type { InformeCapilar } from "@/lib/informe/tipos";
import type { Json } from "@/lib/supabase/database.types";

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

const MAX_FOTOS_ESTUDIO = 10;

/**
 * Añade fotos nuevas a un estudio ya hecho y vuelve a pasar TODAS las
 * fotos por la IA, para que la valoración se recalcule con la
 * información completa. Si la IA falla, el informe anterior se queda
 * como estaba.
 */
export async function recalcularEstudio(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };

  const { data: estudio } = await supabase
    .from("estudios_capilares")
    .select("id, claim_token, informe, fotos_adicionales, estado")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  const informeActual = estudio ? leerInforme(estudio.informe) : null;
  if (!estudio || !informeActual) return { error: "No hemos encontrado este análisis." };

  const nuevas = formData
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (nuevas.length === 0) return { error: "Añade al menos una foto." };
  if (informeActual.fotos.length + nuevas.length > MAX_FOTOS_ESTUDIO) {
    return { error: `Puedes tener como máximo ${MAX_FOTOS_ESTUDIO} fotos por análisis.` };
  }

  const admin = createAdminClient();

  let rutasNuevas: string[];
  try {
    rutasNuevas = await Promise.all(
      nuevas.map((file, i) =>
        subirFotoEstudio(admin, estudio.claim_token, `extra-${Date.now()}-${i}`, file),
      ),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudieron subir las fotos." };
  }

  try {
    const rutas = [...informeActual.fotos.map((f) => f.ruta), ...rutasNuevas];
    const fotos = await Promise.all(
      rutas.map(async (ruta, i) => {
        const { data, error } = await admin.storage.from("estudios-capilares").download(ruta);
        if (error || !data) throw new Error("No se pudo leer una de tus fotos.");
        return {
          etiqueta: `Foto ${i + 1}`,
          base64: Buffer.from(await data.arrayBuffer()).toString("base64"),
          mediaType: data.type || "image/jpeg",
        };
      }),
    );

    const resultado = await analizarFotosCapilares(fotos);
    const informe: InformeCapilar = {
      ...resultado.informe,
      fotos: resultado.informe.fotos.map((f, i) => ({ ...f, ruta: rutas[i] })),
    };

    const { error: updateError } = await admin
      .from("estudios_capilares")
      .update({
        resultado_texto: resultado.resultado_texto,
        norwood_estimado: resultado.norwood_estimado,
        es_alopecia_tratable: resultado.es_alopecia_tratable,
        flujo: informe.flujo,
        informe: informe as unknown as Json,
        fotos_adicionales: [...estudio.fotos_adicionales, ...rutasNuevas],
      })
      .eq("id", estudio.id);
    if (updateError) throw updateError;
  } catch {
    // Las fotos nuevas no han llegado a formar parte del informe: se
    // borran para no dejar archivos huérfanos en el bucket.
    await borrarFotosEstudio(admin, rutasNuevas);
    return {
      error:
        "No hemos podido recalcular la valoración esta vez. Tu informe anterior sigue igual; inténtalo de nuevo en un momento.",
    };
  }

  revalidatePath(`/cuenta/analisis/${id}`);
  return {};
}
