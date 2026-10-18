import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Máximo de emails que una clínica puede poner para recibir leads. */
export const MAX_EMAILS_LEADS = 3;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Limpia, valida, quita duplicados y recorta a MAX_EMAILS_LEADS. */
export function normalizarEmailsLeads(valores: unknown[]): string[] {
  const vistos = new Set<string>();
  const salida: string[] = [];
  for (const v of valores) {
    const email = String(v ?? "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || vistos.has(email)) continue;
    vistos.add(email);
    salida.push(email);
    if (salida.length === MAX_EMAILS_LEADS) break;
  }
  return salida;
}

/**
 * A quién se mandan los avisos de leads de cada clínica: los emails
 * que haya puesto en "Emails para recibir solicitudes" o, si no ha
 * puesto ninguno, el email de la ficha (comportamiento de siempre).
 *
 * Una sola consulta para varias clínicas. `admin` debe ser el cliente
 * con la clave secreta: clinic_privado no tiene políticas RLS.
 */
export async function mapaDestinatariosLeads(
  admin: SupabaseClient<Database>,
  clinicas: { id: string; email: string | null }[],
): Promise<Map<string, string[]>> {
  const mapa = new Map<string, string[]>();
  if (clinicas.length === 0) return mapa;

  const { data } = await admin
    .from("clinic_privado")
    .select("clinic_id, emails_leads")
    .in(
      "clinic_id",
      clinicas.map((c) => c.id),
    );
  const propios = new Map((data ?? []).map((f) => [f.clinic_id, f.emails_leads ?? []]));

  for (const c of clinicas) {
    const lista = normalizarEmailsLeads(propios.get(c.id) ?? []);
    if (lista.length > 0) {
      mapa.set(c.id, lista);
    } else if (c.email) {
      mapa.set(c.id, [c.email]);
    } else {
      mapa.set(c.id, []);
    }
  }
  return mapa;
}

/** Igual que mapaDestinatariosLeads, para una sola clínica. */
export async function destinatariosLeads(
  admin: SupabaseClient<Database>,
  clinica: { id: string; email: string | null },
): Promise<string[]> {
  const mapa = await mapaDestinatariosLeads(admin, [clinica]);
  return mapa.get(clinica.id) ?? [];
}
