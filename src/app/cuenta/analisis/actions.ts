"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { subirFotoEstudio, borrarFotosEstudio } from "@/lib/supabase/estudios-storage";
import { analizarFotosCapilares } from "@/lib/ai/analizar-fotos";

const ANGULOS = [
  { key: "frontal", etiqueta: "Vista frontal" },
  { key: "donante", etiqueta: "Zona donante / nuca" },
  { key: "coronilla", etiqueta: "Coronilla" },
  { key: "perfil_derecho", etiqueta: "Perfil derecho" },
  { key: "perfil_izquierdo", etiqueta: "Perfil izquierdo" },
] as const;

function isRealFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function crearEstudio(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/cuenta/login");
  }

  // Las 5 fotos guiadas son opcionales; se sube la que se haya rellenado.
  const archivosAngulo = ANGULOS.map(({ key, etiqueta }) => {
    const file = formData.get(key);
    return isRealFile(file) ? { key, etiqueta, file } : null;
  }).filter((f): f is NonNullable<typeof f> => f !== null);

  const archivosAdicionales = formData.getAll("adicionales").filter(isRealFile);

  if (archivosAngulo.length === 0 && archivosAdicionales.length === 0) {
    redirect(
      `/cuenta/analisis/nuevo?error=${encodeURIComponent(
        "Sube al menos una foto para poder analizarla.",
      )}`,
    );
  }

  // Subir todas las fotos en paralelo
  let rutasAngulo: Record<string, string>;
  let rutasAdicionales: string[];
  try {
    const [entradasAngulo, entradasAdicionales] = await Promise.all([
      Promise.all(
        archivosAngulo.map(async ({ key, file }) => [
          key,
          await subirFotoEstudio(supabase, user.id, key, file),
        ] as const),
      ),
      Promise.all(
        archivosAdicionales.map((file, i) =>
          subirFotoEstudio(supabase, user.id, `adicional-${i}`, file),
        ),
      ),
    ]);
    rutasAngulo = Object.fromEntries(entradasAngulo);
    rutasAdicionales = entradasAdicionales;
  } catch (e) {
    redirect(
      `/cuenta/analisis/nuevo?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudieron subir las fotos.",
      )}`,
    );
  }

  const { data: estudio, error: insertError } = await supabase
    .from("estudios_capilares")
    .insert({
      user_id: user.id,
      foto_frontal: rutasAngulo.frontal ?? null,
      foto_donante: rutasAngulo.donante ?? null,
      foto_coronilla: rutasAngulo.coronilla ?? null,
      foto_perfil_derecho: rutasAngulo.perfil_derecho ?? null,
      foto_perfil_izquierdo: rutasAngulo.perfil_izquierdo ?? null,
      fotos_adicionales: rutasAdicionales,
      estado: "procesando",
    })
    .select()
    .single();

  if (insertError || !estudio) {
    redirect(
      `/cuenta/analisis/nuevo?error=${encodeURIComponent(
        "No se pudo guardar el estudio. Inténtalo de nuevo.",
      )}`,
    );
  }

  try {
    const fotosParaAnalizar = await Promise.all([
      ...archivosAngulo.map(async ({ etiqueta, file }) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          etiqueta,
          base64: buffer.toString("base64"),
          mediaType: file.type || "image/jpeg",
        };
      }),
      ...archivosAdicionales.map(async (file, i) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          etiqueta: `Foto adicional ${i + 1}`,
          base64: buffer.toString("base64"),
          mediaType: file.type || "image/jpeg",
        };
      }),
    ]);

    const resultado = await analizarFotosCapilares(fotosParaAnalizar);

    const { error: updateError } = await supabase
      .from("estudios_capilares")
      .update({
        resultado_texto: resultado.resultado_texto,
        norwood_estimado: resultado.norwood_estimado,
        es_alopecia_tratable: resultado.es_alopecia_tratable,
        estado: "listo",
      })
      .eq("id", estudio.id);

    if (updateError) throw updateError;
  } catch (e) {
    await supabase
      .from("estudios_capilares")
      .update({
        estado: "error",
        error_detalle: e instanceof Error ? e.message : String(e),
      })
      .eq("id", estudio.id);
  }

  redirect(`/cuenta/analisis/${estudio.id}`);
}

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
    await borrarFotosEstudio(supabase, [
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
