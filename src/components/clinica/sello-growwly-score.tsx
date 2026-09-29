import { SelloScore } from "@/components/ui/sello-score";
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
    <div className="flex items-center gap-4 rounded-2xl border border-yellow/40 bg-gradient-to-br from-yellow/15 via-white to-orange/10 p-4 md:w-[30%]">
      <SelloScore tipo="growwly" valor={score.total} size={96} />
      <p className="text-xs leading-relaxed text-ink-soft">
        <span className="block font-display text-sm font-bold text-teal-dark">Tu Growwly Score</span>
        Afecta a tu puntuación: {FACTORES.map((f) => f.label).join(", ")}.
      </p>
    </div>
  );
}
