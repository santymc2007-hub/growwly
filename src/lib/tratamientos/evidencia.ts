/**
 * Indicador de evidencia científica de cada tratamiento (decidido 26 oct
 * 2026). Mide lo que se sabe de su eficacia frente a la alopecia, no la
 * calidad de una clínica. Solo se enseña cuando está revisado y tiene
 * fuentes.
 */

export const NIVELES_EVIDENCIA = ["alta", "moderada", "preliminar", "insuficiente"] as const;
export type NivelEvidencia = (typeof NIVELES_EVIDENCIA)[number];

export const INFO_NIVEL: Record<
  NivelEvidencia,
  { etiqueta: string; descripcion: string; barras: number; clase: string }
> = {
  alta: {
    etiqueta: "Evidencia alta",
    descripcion: "Varios ensayos clínicos de calidad y guías médicas lo respaldan.",
    barras: 4,
    clase: "bg-[#1f6b43] text-white",
  },
  moderada: {
    etiqueta: "Evidencia moderada",
    descripcion: "Hay ensayos clínicos favorables, pero con resultados variables o estudios pequeños.",
    barras: 3,
    clase: "bg-[#cfebdc] text-[#1f6b43]",
  },
  preliminar: {
    etiqueta: "Evidencia preliminar",
    descripcion: "Resultados prometedores en laboratorio o estudios pequeños; faltan ensayos sólidos.",
    barras: 2,
    clase: "bg-[#fff1c7] text-[#7a5200]",
  },
  insuficiente: {
    etiqueta: "Evidencia insuficiente",
    descripcion: "No hay estudios que demuestren que recupere pelo.",
    barras: 1,
    clase: "bg-[#eef1f0] text-[#4b5753]",
  },
};

export type FuenteEvidencia = { titulo: string; url: string };

export function nivelValido(v: unknown): NivelEvidencia | null {
  return typeof v === "string" && (NIVELES_EVIDENCIA as readonly string[]).includes(v)
    ? (v as NivelEvidencia)
    : null;
}

export function leerFuentes(v: unknown): FuenteEvidencia[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (f): f is FuenteEvidencia =>
        !!f && typeof f.titulo === "string" && typeof f.url === "string" && /^https:\/\//.test(f.url),
    )
    .slice(0, 6);
}

export const MAX_FUENTES = 4;
