import { createAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";

const BUCKET = "estudios-capilares";

type Params = { token: string };

/**
 * Sirve la foto "de portada" de un lead ya reducida de resolución y
 * desenfocada, para la vista anonimizada (antes de desbloquear).
 *
 * Importante: el desenfoque se hace aquí, en el servidor, sobre los
 * bytes reales — nunca se manda la foto original al navegador. Un
 * simple `filter: blur()` en CSS no serviría: la imagen original
 * viajaría igual y cualquiera podría verla abriendo la URL directa o
 * quitando el CSS. Además de desenfocar, se reduce mucho la
 * resolución antes: así se pierde información real, no solo el
 * aspecto — un blur sobre una foto de resolución completa a veces se
 * puede revertir parcialmente con herramientas de "unblur".
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: lead } = await supabase
    .from("leads_clinica")
    .select("solicitud_id")
    .eq("token", token)
    .maybeSingle();
  if (!lead) {
    return new Response("No encontrado", { status: 404 });
  }

  const { data: solicitud } = await supabase
    .from("solicitudes_presupuesto")
    .select("estudio_id")
    .eq("id", lead.solicitud_id)
    .maybeSingle();
  if (!solicitud?.estudio_id) {
    return new Response("Sin foto", { status: 404 });
  }

  const { data: estudio } = await supabase
    .from("estudios_capilares")
    .select(
      "foto_frontal, foto_coronilla, foto_donante, foto_perfil_derecho, foto_perfil_izquierdo, fotos_adicionales",
    )
    .eq("id", solicitud.estudio_id)
    .maybeSingle();
  if (!estudio) {
    return new Response("Sin foto", { status: 404 });
  }

  const ruta =
    estudio.foto_frontal ??
    estudio.foto_coronilla ??
    estudio.foto_donante ??
    estudio.foto_perfil_derecho ??
    estudio.foto_perfil_izquierdo ??
    estudio.fotos_adicionales?.[0] ??
    null;
  if (!ruta) {
    return new Response("Sin foto", { status: 404 });
  }

  const { data: archivo, error } = await supabase.storage
    .from(BUCKET)
    .download(ruta);
  if (error || !archivo) {
    return new Response("No se pudo leer la foto", { status: 502 });
  }

  const bytes = Buffer.from(await archivo.arrayBuffer());
  const borrosa = await sharp(bytes)
    .resize(220) // primero se reduce mucho la resolución...
    .blur(18) // ...y luego se desenfoca. Las dos cosas a la vez.
    .jpeg({ quality: 60 })
    .toBuffer();

  return new Response(new Uint8Array(borrosa), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
