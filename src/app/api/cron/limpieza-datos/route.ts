import { NextResponse } from "next/server";
import { cronAutorizado } from "@/lib/cron/autorizado";
import { createAdminClient } from "@/lib/supabase/admin";
import { borrarFotosEstudio } from "@/lib/supabase/estudios-storage";

/**
 * Vercel Cron llama a esta ruta una vez al día (ver vercel.json).
 * Aplica los plazos de conservación que promete la política de
 * privacidad (/legal/privacidad, apartado 7):
 *
 * - Valoraciones hechas sin cuenta (nunca reclamadas): 6 meses → se
 *   borran con sus fotos.
 * - Solicitudes de presupuesto: 2 años → se borran (en cascada caen sus
 *   leads, propuestas y eventos). Igual con las peticiones de cita
 *   directa desde la ficha.
 * - Huella de IP para limitar abusos: se quita a los 30 días (la
 *   política dice "nunca más de 6 meses"; el límite solo mira 1 hora).
 *
 * Si cambian los plazos de la política, cambiarlos aquí también.
 */
const LOTE = 200;

function haceMeses(meses: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return d.toISOString();
}

export async function GET(request: Request) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1. Valoraciones sin cuenta de hace más de 6 meses.
  const { data: anonimos } = await admin
    .from("estudios_capilares")
    .select(
      "id, foto_frontal, foto_donante, foto_coronilla, foto_perfil_derecho, foto_perfil_izquierdo, fotos_adicionales",
    )
    .is("user_id", null)
    .lt("created_at", haceMeses(6))
    .limit(LOTE);

  let valoraciones = 0;
  for (const e of anonimos ?? []) {
    await borrarFotosEstudio(admin, [
      e.foto_frontal,
      e.foto_donante,
      e.foto_coronilla,
      e.foto_perfil_derecho,
      e.foto_perfil_izquierdo,
      ...(e.fotos_adicionales ?? []),
    ]);
    const { error } = await admin.from("estudios_capilares").delete().eq("id", e.id);
    if (!error) valoraciones++;
  }

  // 2. Solicitudes de presupuesto y de cita directa de hace más de 2 años.
  const hace2Anios = haceMeses(24);
  const { count: solicitudes } = await admin
    .from("solicitudes_presupuesto")
    .delete({ count: "exact" })
    .lt("created_at", hace2Anios);
  const { count: citasDirectas } = await admin
    .from("solicitudes_cita_directa")
    .delete({ count: "exact" })
    .lt("creado_en", hace2Anios);

  // 3. Huella de IP: fuera a los 30 días.
  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: huellas } = await admin
    .from("estudios_capilares")
    .update({ ip_hash: null }, { count: "exact" })
    .not("ip_hash", "is", null)
    .lt("created_at", hace30Dias);

  return NextResponse.json({
    ok: true,
    valoraciones,
    solicitudes: solicitudes ?? 0,
    citasDirectas: citasDirectas ?? 0,
    huellas: huellas ?? 0,
  });
}
