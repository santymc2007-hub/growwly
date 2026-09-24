import type { Clinic } from "@/lib/supabase/database.types";
import { calcularCompletitud } from "@/lib/clinica/completitud";
import type { MetricasLeadsClinica } from "@/lib/leads/metricas-clinica";

/**
 * Pesos del Growwly Score — configurables aquí, nunca hardcodeados en
 * un componente de UI. El 90% depende de cosas que la clínica puede
 * mejorar dentro de Growwly (perfil, respuesta, gestión, ofertas); el
 * 10% restante (Google) ya se lo curra la propia clínica por su cuenta.
 */
export const GROWWLY_SCORE_WEIGHTS = {
  perfilCompleto: 0.3,
  tiempoRespuesta: 0.3,
  gestionLeads: 0.15,
  ofertasActivas: 0.15,
  googleRating: 0.1,
} as const;

export type DesgloseGrowwlyScore = {
  perfilCompleto: number;
  tiempoRespuesta: number;
  gestionLeads: number;
  ofertasActivas: number;
  googleRating: number;
};

export type GrowwlyScore = {
  total: number;
  desglose: DesgloseGrowwlyScore;
};

/**
 * Tramos de puntuación por tiempo de respuesta, tal cual el
 * documento: no son definitivos, se ajustarán con datos reales.
 */
function puntosTiempoRespuesta(minutos: number | null): number {
  if (minutos == null) return 50; // sin datos todavía: ni premia ni penaliza
  if (minutos < 15) return 100;
  if (minutos < 60) return 90;
  if (minutos < 180) return 75; // 1-3h
  if (minutos < 720) return 55; // 3-12h
  if (minutos < 1440) return 30; // 12-24h
  return 10;
}

function puntosGestionLeads(tasa: number | null): number {
  if (tasa == null) return 50;
  return Math.round(Math.min(1, Math.max(0, tasa)) * 100);
}

function puntosOfertasActivas(clinic: Clinic): number {
  const señales = [
    clinic.tiene_oferta,
    clinic.primera_consulta_gratis,
    clinic.financiacion,
    clinic.acepta_videoconsulta,
  ];
  const activas = señales.filter(Boolean).length;
  return Math.round((activas / señales.length) * 100);
}

function puntosGoogleRating(rating: number | null): number {
  if (rating == null) return 50;
  return Math.round((Math.min(5, Math.max(0, rating)) / 5) * 100);
}

export function calcularGrowwlyScore(
  clinic: Clinic,
  metricas: MetricasLeadsClinica,
): GrowwlyScore {
  const desglose: DesgloseGrowwlyScore = {
    perfilCompleto: calcularCompletitud(clinic),
    tiempoRespuesta: puntosTiempoRespuesta(metricas.tiempoRespuestaPromedioMinutos),
    gestionLeads: puntosGestionLeads(metricas.tasaGestionLeads),
    ofertasActivas: puntosOfertasActivas(clinic),
    googleRating: puntosGoogleRating(clinic.rating_google),
  };

  const total = Math.round(
    desglose.perfilCompleto * GROWWLY_SCORE_WEIGHTS.perfilCompleto +
      desglose.tiempoRespuesta * GROWWLY_SCORE_WEIGHTS.tiempoRespuesta +
      desglose.gestionLeads * GROWWLY_SCORE_WEIGHTS.gestionLeads +
      desglose.ofertasActivas * GROWWLY_SCORE_WEIGHTS.ofertasActivas +
      desglose.googleRating * GROWWLY_SCORE_WEIGHTS.googleRating,
  );

  return { total, desglose };
}
