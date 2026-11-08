import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { huellaIp } from "@/lib/seguridad/huella-ip";

const METODOS_VALIDOS = [
  "llamar",
  "whatsapp",
  "web",
  "reserva_online",
  "ver_mapa",
  "pedir_cita",
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Límite por IP: un visitante real hace unos pocos clics en una ficha;
 * más de LIMITE en una ventana de un minuto es un script. Se guarda en
 * memoria de la instancia (sin tocar la base de datos): en serverless
 * cada instancia cuenta por su cuenta, así que no es un tope exacto,
 * pero basta para frenar un bucle que machaque la ruta. La IP no se
 * guarda en claro (huella con sal, igual que en el resto de la web).
 */
const VENTANA_MS = 60_000;
const LIMITE = 20;
const MAX_ENTRADAS = 5_000;
const visitas = new Map<string, { n: number; desde: number }>();

function superaLimite(huella: string): boolean {
  const ahora = Date.now();

  if (visitas.size > MAX_ENTRADAS) {
    for (const [k, v] of visitas) {
      if (ahora - v.desde > VENTANA_MS) visitas.delete(k);
    }
    // Si sigue lleno (todas recientes), se vacía para no crecer sin tope.
    if (visitas.size > MAX_ENTRADAS) visitas.clear();
  }

  const actual = visitas.get(huella);
  if (!actual || ahora - actual.desde > VENTANA_MS) {
    visitas.set(huella, { n: 1, desde: ahora });
    return false;
  }
  actual.n += 1;
  return actual.n > LIMITE;
}

/**
 * Registro propio (no depende de que se acepten las cookies
 * analíticas) de cada clic en los botones de contacto de una ficha de
 * clínica — es el dato que se le enseña a la clínica como argumento
 * de valor en sus estadísticas, así que conviene que sea exacto.
 *
 * Esta ruta solo AÑADE filas; no hay forma de bajar los contadores
 * desde aquí.
 */
export async function POST(request: Request) {
  const huella = await huellaIp();
  if (huella && superaLimite(huella)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const clinicId = typeof body?.clinicId === "string" ? body.clinicId : null;
  const metodo = typeof body?.metodo === "string" ? body.metodo : null;

  if (
    !clinicId ||
    !UUID.test(clinicId) ||
    !metodo ||
    !METODOS_VALIDOS.includes(metodo as (typeof METODOS_VALIDOS)[number])
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("clinic_contact_clicks").insert({ clinic_id: clinicId, metodo });

  return NextResponse.json({ ok: true });
}
