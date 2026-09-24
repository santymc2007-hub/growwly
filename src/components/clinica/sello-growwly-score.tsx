import type { GrowwlyScore } from "@/lib/leads/growwly-score";

function mensajeGrowwlyScore(total: number): string {
  if (total >= 80) return "cumple sobradamente los requisitos para atraer leads";
  if (total >= 60) return "cumple la mayoría de los requisitos para atraer leads";
  if (total >= 40) return "cumple algunos requisitos, pero puede mejorar mucho";
  return "todavía cumple pocos requisitos para atraer leads";
}

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
 * Cuanto más alto, más leads recibe: el 90% del cálculo depende de
 * cosas que la propia clínica puede mejorar.
 */
export function SelloGrowwlyScore({ score }: { score: GrowwlyScore }) {
  return (
    <div className="rounded-2xl border border-yellow/40 bg-gradient-to-br from-yellow/15 via-white to-orange/10 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange">
            Growwly Score
          </p>
          <p className="mt-1 font-medium text-ink">
            {score.total >= 60 ? "¡Enhorabuena!" : "Vas por buen camino."} Tu clínica{" "}
            {mensajeGrowwlyScore(score.total)}.
          </p>
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <span className="font-display text-xl font-extrabold text-teal-dark">
            {score.total}%
          </span>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
        {FACTORES.map(({ clave, label }) => (
          <div key={clave}>
            <dt className="text-[11px] text-ink-soft">{label}</dt>
            <dd className="text-sm font-semibold text-ink">
              {score.desglose[clave]}%
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
