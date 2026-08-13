import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

import type { Database } from "@/lib/supabase/database.types";

type Tipo = "destacado" | "destacado_home" | "destacado_ciudad" | "premium";
type FechasVisibilidad = Record<
  string,
  { activado_en: string; expira_en: string | null }
>;
type ClinicUpdate = Database["public"]["Tables"]["clinics"]["Update"];

/**
 * Vercel Cron llama a esta ruta una vez al día (ver vercel.json).
 * Recorre las clínicas con alguna fecha de expiración guardada y
 * desactiva lo que ya haya caducado.
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
    .select("id, plan, destacado, destacado_home, destacado_ciudad, visibilidad_fechas")
    .or(
      "destacado.eq.true,destacado_home.eq.true,destacado_ciudad.eq.true,plan.eq.premium",
    );

  const ahora = new Date();
  let desactivadas = 0;

  for (const clinic of clinicas ?? []) {
    const fechas =
      clinic.visibilidad_fechas &&
      typeof clinic.visibilidad_fechas === "object" &&
      !Array.isArray(clinic.visibilidad_fechas)
        ? (clinic.visibilidad_fechas as FechasVisibilidad)
        : {};

    const update: ClinicUpdate = {};
    let cambios = false;

    for (const tipo of Object.keys(fechas) as Tipo[]) {
      const info = fechas[tipo];
      if (info?.expira_en && new Date(info.expira_en) <= ahora) {
        delete fechas[tipo];
        if (tipo === "premium") {
          update.plan = "basico";
        } else if (tipo === "destacado") {
          update.destacado = false;
        } else if (tipo === "destacado_home") {
          update.destacado_home = false;
        } else {
          update.destacado_ciudad = false;
        }
        cambios = true;
        desactivadas++;
      }
    }

    if (cambios) {
      update.visibilidad_fechas = fechas;
      await supabase.from("clinics").update(update).eq("id", clinic.id);
    }
  }

  return NextResponse.json({ ok: true, desactivadas });
}
