import type { GrowwlyScore } from "@/lib/leads/growwly-score";

const FACTORES: { clave: keyof GrowwlyScore["desglose"]; label: string }[] = [
  { clave: "perfilCompleto", label: "Perfil completo" },
  { clave: "tiempoRespuesta", label: "Velocidad de respuesta" },
  { clave: "gestionLeads", label: "Gestión de leads" },
  { clave: "ofertasActivas", label: "Ofertas activas" },
  { clave: "googleRating", label: "Valoraciones Google" },
];

/**
 * Sello gráfico del Growwly Score en el panel de la clínica — mide
 * cómo trabaja la clínica dentro de Growwly (no es lo mismo que el
 * Match Score, que mide cuánto encaja con un paciente en concreto).
 * Solo se enseña el total: el desglose por factor es información
 * interna para el reparto de leads, no algo que la clínica deba
 * "optimizar" número a número — aquí solo ve QUÉ factores cuentan.
 */
export function SelloGrowwlyScore({ score }: { score: GrowwlyScore }) {
  return (
    <div className="flex flex-col justify-center gap-3 rounded-2xl border border-yellow/40 bg-gradient-to-br from-yellow/15 via-white to-orange/10 p-4 md:w-[30%]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-hand text-3xl leading-none text-orange">
          Growwly Score
        </p>
        <span className="shrink-0 font-display text-xl font-extrabold text-teal-dark">
          {score.total}%
        </span>
      </div>
      <p className="text-xs text-ink-soft">
        Afecta a tu puntuación:{" "}
        {FACTORES.map((f) => f.label).join(", ")}.
      </p>
    </div>
  );
}
