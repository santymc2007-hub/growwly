import { createAdminClient } from "@/lib/supabase/admin";

export type ClinicaReclamable = { id: string; nombre: string; ciudad: string | null };

/**
 * Fichas que se pueden reclamar desde /clinica/registro: publicadas (las
 * que se ven en la web) y sin ningún gestor aprobado todavía. Las no
 * publicadas (p. ej. altas nuevas pendientes de revisar) no salen.
 *
 * Usa la clave secreta: hay que leer perfiles de clínica para saber
 * cuáles tienen ya dueño. Solo devuelve id, nombre y ciudad.
 */
async function todasLasReclamables(): Promise<ClinicaReclamable[]> {
  const admin = createAdminClient();
  const [{ data: clinicas }, { data: aprobadas }] = await Promise.all([
    admin.from("clinics").select("id, nombre, ciudad").eq("publicado", true),
    admin
      .from("profiles")
      .select("clinic_id")
      .eq("role", "clinic")
      .eq("clinic_status", "aprobado"),
  ]);
  const reclamadas = new Set((aprobadas ?? []).map((p) => p.clinic_id));
  return (clinicas ?? []).filter((c) => !reclamadas.has(c.id));
}

/** Minúsculas y sin tildes, para buscar "clinica" y encontrar "Clínica". */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca entre las reclamables por nombre y ciudad. Todas las palabras
 * escritas tienen que aparecer; primero las que empiezan por lo escrito.
 */
export async function buscarClinicasReclamables(
  consulta: string,
  limite = 8,
): Promise<ClinicaReclamable[]> {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0 || palabras.join("").length < 2) return [];

  const candidatas = await todasLasReclamables();
  const primera = palabras[0];

  return candidatas
    .map((c) => {
      const nombre = normalizar(c.nombre);
      const texto = `${nombre} ${normalizar(c.ciudad ?? "")}`;
      if (!palabras.every((p) => texto.includes(p))) return null;
      const puntos = nombre.startsWith(primera)
        ? 0
        : nombre.split(/\s+/).some((w) => w.startsWith(primera))
          ? 1
          : 2;
      return { c, puntos };
    })
    .filter((x): x is { c: ClinicaReclamable; puntos: number } => x !== null)
    .sort((a, b) => a.puntos - b.puntos || a.c.nombre.localeCompare(b.c.nombre, "es"))
    .slice(0, limite)
    .map((x) => x.c);
}

/** La ficha concreta, si se puede reclamar (si no, null). */
export async function clinicaReclamable(id: string): Promise<ClinicaReclamable | null> {
  if (!id) return null;
  const admin = createAdminClient();
  const [{ data: clinica }, { count }] = await Promise.all([
    admin
      .from("clinics")
      .select("id, nombre, ciudad")
      .eq("id", id)
      .eq("publicado", true)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", id)
      .eq("clinic_status", "aprobado"),
  ]);
  if (!clinica || (count ?? 0) > 0) return null;
  return clinica;
}
