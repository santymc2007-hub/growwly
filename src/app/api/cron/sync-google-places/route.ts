import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerDetallesPlace } from "@/lib/google-places";

/**
 * Vercel Cron llama a esta ruta una vez a la semana (ver vercel.json)
 * para refrescar ubicación, rating y reseñas reales de Google Maps de
 * cada clínica que ya tiene google_place_id confirmado a mano (ver
 * migración 20260929120000). No hace nada con las que no lo tienen —
 * no se intenta adivinar/emparejar automáticamente.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();

  const { data: clinicas } = await supabase
    .from("clinics")
    .select("id, google_place_id")
    .not("google_place_id", "is", null);

  let sincronizadas = 0;
  const errores: { id: string; error: string }[] = [];

  for (const clinica of clinicas ?? []) {
    try {
      const detalles = await obtenerDetallesPlace(clinica.google_place_id!);
      await supabase
        .from("clinics")
        .update({
          rating_google: detalles.rating,
          resenas_google: detalles.totalResenas,
          lat: detalles.lat,
          lng: detalles.lng,
          google_reviews: detalles.resenas,
          google_maps_url: detalles.mapsUri,
          google_synced_at: new Date().toISOString(),
        })
        .eq("id", clinica.id);
      sincronizadas++;
    } catch (e) {
      errores.push({ id: clinica.id, error: e instanceof Error ? e.message : "desconocido" });
    }
  }

  return NextResponse.json({ ok: true, sincronizadas, errores });
}
