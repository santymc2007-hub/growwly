import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const METODOS_VALIDOS = ["llamar", "whatsapp", "web", "reserva_online"] as const;

/**
 * Registro propio (no depende de que se acepten las cookies
 * analíticas) de cada clic en los botones de contacto de una ficha de
 * clínica — es el dato que se le enseña a la clínica como argumento
 * de valor en sus estadísticas, así que conviene que sea exacto.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const clinicId = typeof body?.clinicId === "string" ? body.clinicId : null;
  const metodo = typeof body?.metodo === "string" ? body.metodo : null;

  if (!clinicId || !metodo || !METODOS_VALIDOS.includes(metodo as (typeof METODOS_VALIDOS)[number])) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("clinic_contact_clicks").insert({ clinic_id: clinicId, metodo });

  return NextResponse.json({ ok: true });
}
