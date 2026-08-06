"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { subirFotoEstudio } from "@/lib/supabase/estudios-storage";
import { analizarFotosCapilares } from "@/lib/ai/analizar-fotos";

const ANGULOS = [
  "frontal",
  "donante",
  "coronilla",
  "perfil_derecho",
  "perfil_izquierdo",
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

  const archivos: Record<(typeof ANGULOS)[number], File> = {} as never;
  for (const angulo of ANGULOS) {
    const file = formData.get(angulo);
    if (!isRealFile(file)) {
      redirect(
        `/cuenta/analisis/nuevo?error=${encodeURIComponent(
          "Sube las 5 fotos — todas hacen falta para el análisis.",
        )}`,
      );
    }
    archivos[angulo] = file;
  }

  // Subir las 5 fotos en paralelo
  let rutas: Record<(typeof ANGULOS)[number], string>;
  try {
    const entradas = await Promise.all(
      ANGULOS.map(async (angulo) => [
        angulo,
        await subirFotoEstudio(supabase, user.id, angulo, archivos[angulo]),
      ] as const),
    );
    rutas = Object.fromEntries(entradas) as typeof rutas;
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
      foto_frontal: rutas.frontal,
      foto_donante: rutas.donante,
      foto_coronilla: rutas.coronilla,
      foto_perfil_derecho: rutas.perfil_derecho,
      foto_perfil_izquierdo: rutas.perfil_izquierdo,
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
    const fotosParaAnalizar = await Promise.all(
      ANGULOS.map(async (angulo) => {
        const buffer = Buffer.from(await archivos[angulo].arrayBuffer());
        return {
          angulo,
          base64: buffer.toString("base64"),
          mediaType: archivos[angulo].type || "image/jpeg",
        };
      }),
    );

    const resultado = await analizarFotosCapilares(fotosParaAnalizar);

    await supabase
      .from("estudios_capilares")
      .update({
        resultado_texto: resultado.resultado_texto,
        norwood_estimado: resultado.norwood_estimado,
        es_alopecia_tratable: resultado.es_alopecia_tratable,
        estado: "listo",
      })
      .eq("id", estudio.id);
  } catch {
    await supabase
      .from("estudios_capilares")
      .update({ estado: "error" })
      .eq("id", estudio.id);
  }

  redirect(`/cuenta/analisis/${estudio.id}`);
}
