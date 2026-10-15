"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subirFotoEstudio } from "@/lib/supabase/estudios-storage";
import { analizarFotosCapilares } from "@/lib/ai/analizar-fotos";
import type { InformeCapilar } from "@/lib/informe/tipos";
import type { Json } from "@/lib/supabase/database.types";

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

// Límites del análisis (auditoría de seguridad, oct 2026): cada envío
// es una llamada de pago a la API de IA, y antes no había ningún tope.
const MAX_FOTOS = 10;
const MAX_BYTES_FOTO = 15 * 1024 * 1024;
const MAX_POR_IP_HORA = 5;
const MAX_GLOBAL_HORA = 200;
const TIPOS_VALIDOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"];
const EXTENSIONES_VALIDAS = ["jpg", "jpeg", "png", "webp", "heic", "heif", "avif"];

function esImagenValida(file: File): boolean {
  if (file.size > MAX_BYTES_FOTO) return false;
  if (file.type) return TIPOS_VALIDOS.includes(file.type.toLowerCase());
  // Algunos móviles mandan la foto sin content-type: se mira la extensión.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSIONES_VALIDAS.includes(ext);
}

async function huellaIp(): Promise<string | null> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || null;
  if (!ip) return null;
  // Con sal secreta: no se guarda la IP en claro ni se puede revertir
  // con una tabla de IPs.
  const sal = process.env.SUPABASE_SECRET_KEY ?? "growwly";
  return createHash("sha256").update(`${sal}:${ip}`).digest("hex");
}

function errorAnalisis(mensaje: string): never {
  redirect(`/analisis/nuevo?error=${encodeURIComponent(mensaje)}`);
}

export async function crearEstudio(formData: FormData) {
  // Si hay sesión, el estudio queda suyo desde ya. Si no, queda "sin
  // dueño" hasta que se registre/inicie sesión (vía claim_token).
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  const admin = createAdminClient();

  const archivosAngulo = ANGULOS.map(({ key, etiqueta }) => {
    const file = formData.get(key);
    return isRealFile(file) ? { key, etiqueta, file } : null;
  }).filter((f): f is NonNullable<typeof f> => f !== null);

  const archivosAdicionales = formData.getAll("adicionales").filter(isRealFile);

  if (archivosAngulo.length === 0 && archivosAdicionales.length === 0) {
    redirect(
      `/analisis/nuevo?error=${encodeURIComponent(
        "Sube al menos una foto para poder analizarla.",
      )}`,
    );
  }

  // Consentimiento explícito (fotos = datos de salud) + mayoría de edad.
  if (formData.get("consentimiento") !== "on") {
    errorAnalisis("Para analizar tus fotos necesitamos que marques la casilla de consentimiento.");
  }
  if (formData.get("aviso_no_diagnostico") !== "on") {
    errorAnalisis("Marca la casilla que confirma que entiendes que la valoración no es un diagnóstico médico.");
  }

  const todos = [...archivosAngulo.map((a) => a.file), ...archivosAdicionales];
  if (todos.length > MAX_FOTOS) {
    errorAnalisis(`Puedes subir como máximo ${MAX_FOTOS} fotos por análisis.`);
  }
  if (!todos.every(esImagenValida)) {
    errorAnalisis("Solo se admiten fotos JPG, PNG, WEBP o HEIC de hasta 15 MB.");
  }

  const ipHash = await huellaIp();
  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [{ count: porIp }, { count: global }] = await Promise.all([
    ipHash
      ? admin
          .from("estudios_capilares")
          .select("id", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gte("created_at", haceUnaHora)
      : Promise.resolve({ count: 0 }),
    admin
      .from("estudios_capilares")
      .select("id", { count: "exact", head: true })
      .gte("created_at", haceUnaHora),
  ]);
  if ((porIp ?? 0) >= MAX_POR_IP_HORA) {
    errorAnalisis("Has hecho varios análisis seguidos. Espera un rato y vuelve a intentarlo.");
  }
  if ((global ?? 0) >= MAX_GLOBAL_HORA) {
    errorAnalisis("Ahora mismo estamos recibiendo muchos análisis. Inténtalo de nuevo en unos minutos.");
  }

  const claimToken = crypto.randomUUID();

  let rutasAngulo: Record<string, string>;
  let rutasAdicionales: string[];
  try {
    const [entradasAngulo, entradasAdicionales] = await Promise.all([
      Promise.all(
        archivosAngulo.map(async ({ key, file }) => [
          key,
          await subirFotoEstudio(admin, claimToken, key, file),
        ] as const),
      ),
      Promise.all(
        archivosAdicionales.map((file, i) =>
          subirFotoEstudio(admin, claimToken, `adicional-${i}`, file),
        ),
      ),
    ]);
    rutasAngulo = Object.fromEntries(entradasAngulo);
    rutasAdicionales = entradasAdicionales;
  } catch (e) {
    redirect(
      `/analisis/nuevo?error=${encodeURIComponent(
        e instanceof Error ? e.message : "No se pudieron subir las fotos.",
      )}`,
    );
  }

  const { data: estudio, error: insertError } = await admin
    .from("estudios_capilares")
    .insert({
      user_id: user?.id ?? null,
      claim_token: claimToken,
      foto_frontal: rutasAngulo.frontal ?? null,
      foto_donante: rutasAngulo.donante ?? null,
      foto_coronilla: rutasAngulo.coronilla ?? null,
      foto_perfil_derecho: rutasAngulo.perfil_derecho ?? null,
      foto_perfil_izquierdo: rutasAngulo.perfil_izquierdo ?? null,
      fotos_adicionales: rutasAdicionales,
      estado: "procesando",
      consentimiento_en: new Date().toISOString(),
      ip_hash: ipHash,
    })
    .select()
    .single();

  if (insertError || !estudio) {
    redirect(
      `/analisis/nuevo?error=${encodeURIComponent(
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

    // Mismo orden en que se mandaron las fotos a la IA: primero las de
    // ángulo, luego las adicionales. Así cada foto del informe sabe cuál
    // es su ruta en el bucket.
    const rutasEnOrden = [
      ...archivosAngulo.map(({ key }) => rutasAngulo[key]),
      ...rutasAdicionales,
    ];
    const informe: InformeCapilar = {
      ...resultado.informe,
      fotos: resultado.informe.fotos.map((f, i) => ({ ...f, ruta: rutasEnOrden[i] })),
    };

    const { error: updateError } = await admin
      .from("estudios_capilares")
      .update({
        resultado_texto: resultado.resultado_texto,
        norwood_estimado: resultado.norwood_estimado,
        es_alopecia_tratable: resultado.es_alopecia_tratable,
        flujo: informe.flujo,
        informe: informe as unknown as Json,
        estado: "listo",
      })
      .eq("id", estudio.id);

    if (updateError) throw updateError;
  } catch (e) {
    await admin
      .from("estudios_capilares")
      .update({
        estado: "error",
        error_detalle: e instanceof Error ? e.message : String(e),
      })
      .eq("id", estudio.id);
  }

  // Ya logueado: directo al resultado. Anónimo: pantalla de "date de
  // alta para verlo" — el resultado no se entrega sin cuenta.
  if (user) {
    redirect(`/cuenta/analisis/${estudio.id}?enviado=1`);
  }
  redirect(`/analisis/${claimToken}?enviado=1`);
}
