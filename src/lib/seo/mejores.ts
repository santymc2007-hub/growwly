import type { Clinic } from "@/lib/supabase/database.types";
import { DESCRIPCION_MIN_CARACTERES } from "@/lib/clinic-options";

/**
 * Páginas «Las mejores clínicas de … en …» (decidido 25 oct 2026).
 *
 * El orden lo da el Growwly Score de ranking, pensado para el paciente:
 * reseñas de Google (nota con peso según cuántas hay, volumen y que
 * sean recientes) + ficha completa y actualizada. Solo cuenta lo que
 * cualquier clínica puede rellenar: Premium y Destacados NO puntúan.
 * Si cambian los pesos, cambiar también la explicación de la página.
 */
export const PESOS_RANKING = {
  notaGoogle: 0.45,
  volumenResenas: 0.1,
  resenasRecientes: 0.05,
  fichaCompleta: 0.3,
  fichaActualizada: 0.1,
} as const;

/** Mínimo de centros para que exista la página (si no, no es un ranking). */
export const MIN_CENTROS_RANKING = 3;
/** Cuántos centros entran en el ranking. */
export const TOP_RANKING = 10;

export type FilaRanking = {
  clinica: Clinic;
  score: number;
  motivos: string[];
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const MESES = 1000 * 60 * 60 * 24 * 30.4;

/**
 * Nota «bayesiana»: una clínica con pocas reseñas se acerca a la media
 * del sector, así un 5★ con 7 reseñas no gana a un 4,8★ con 800.
 */
function notaPonderada(rating: number, n: number): number {
  const PRIOR = 4.5;
  const PESO_PRIOR = 30;
  return (rating * n + PRIOR * PESO_PRIOR) / (n + PESO_PRIOR);
}

function ultimaResena(c: Clinic): Date | null {
  if (!Array.isArray(c.google_reviews)) return null;
  let max: number | null = null;
  for (const r of c.google_reviews as { fecha?: string }[]) {
    const t = r?.fecha ? Date.parse(r.fecha) : NaN;
    if (!Number.isNaN(t) && (max == null || t > max)) max = t;
  }
  return max == null ? null : new Date(max);
}

function puntosAntiguedad(fecha: Date | null, ahora: number): number {
  if (!fecha) return 0;
  const meses = (ahora - fecha.getTime()) / MESES;
  if (meses <= 3) return 1;
  if (meses <= 6) return 0.75;
  if (meses <= 12) return 0.45;
  return 0.15;
}

/** Ficha completa con lo que puede rellenar cualquier clínica (sin Premium). */
function fichaCompleta(c: Clinic): number {
  const checks = [
    (c.descripcion?.length ?? 0) >= DESCRIPCION_MIN_CARACTERES,
    c.fotos.length >= 5,
    c.fotos.length >= 1,
    Boolean(c.logo_url),
    Boolean(c.telefono),
    Boolean(c.web),
    Boolean(c.direccion),
    Array.isArray(c.horarios_estructurados) && c.horarios_estructurados.length > 0,
    c.tecnicas.length > 0,
    c.idiomas.length > 0,
    Boolean(c.registro_sanitario),
    Boolean(c.financiacion_tipo),
    Boolean(c.parking),
    Boolean(c.quien_opera),
  ];
  return checks.filter(Boolean).length / checks.length;
}

export function puntuarRanking(c: Clinic, ahora = Date.now()): FilaRanking {
  const rating = c.rating_google != null ? Number(c.rating_google) : null;
  const n = c.resenas_google ?? 0;

  const nota = rating != null && n > 0 ? clamp((notaPonderada(rating, n) - 3.5) / 1.5) : 0;
  const volumen = clamp(Math.log10(n + 1) / Math.log10(501));
  const ultima = ultimaResena(c);
  const recientes = puntosAntiguedad(ultima, ahora);
  const ficha = fichaCompleta(c);
  const actualizada = puntosAntiguedad(c.updated_at ? new Date(c.updated_at) : null, ahora);

  const score = Math.round(
    100 *
      (nota * PESOS_RANKING.notaGoogle +
        volumen * PESOS_RANKING.volumenResenas +
        recientes * PESOS_RANKING.resenasRecientes +
        ficha * PESOS_RANKING.fichaCompleta +
        actualizada * PESOS_RANKING.fichaActualizada),
  );

  const motivos: string[] = [];
  if (rating != null && n > 0) {
    motivos.push(
      `${rating.toFixed(1).replace(".", ",")}★ en Google con ${n.toLocaleString("es-ES")} reseña${n === 1 ? "" : "s"}`,
    );
  }
  if (recientes >= 0.75) motivos.push("Reseñas recientes");
  if (ficha >= 0.8) motivos.push("Ficha muy completa");
  else if (ficha >= 0.6) motivos.push("Ficha completa");
  if (c.fotos.length >= 5) motivos.push(`${c.fotos.length} fotos del centro`);
  if (c.verificado) motivos.push("Verificado por Growwly");

  return { clinica: c, score, motivos };
}

export function ranking(centros: Clinic[]): FilaRanking[] {
  const ahora = Date.now();
  return centros
    .map((c) => puntuarRanking(c, ahora))
    .sort((a, b) => b.score - a.score || a.clinica.nombre.localeCompare(b.clinica.nombre, "es"))
    .slice(0, TOP_RANKING);
}

/** Tema «clínicas capilares» (todas) o el slug de un tratamiento. */
export const TEMA_GENERAL = "clinicas-capilares";
