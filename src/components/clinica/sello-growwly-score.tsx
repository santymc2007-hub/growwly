"use client";

import { useState } from "react";
import { SelloScore } from "@/components/ui/sello-score";
import type { GrowwlyScore } from "@/lib/leads/growwly-score";

const FACTORES: { clave: keyof GrowwlyScore["desglose"]; label: string }[] = [
  { clave: "perfilCompleto", label: "Perfil completo" },
  { clave: "tiempoRespuesta", label: "Velocidad de respuesta" },
  { clave: "gestionLeads", label: "Gestión de leads" },
  { clave: "ofertasActivas", label: "Ofertas activas" },
  { clave: "googleRating", label: "Valoraciones Google" },
];

const TOOLTIP_TEXTO = `Esta puntuación es la media de cómo destacas en: ${FACTORES.map((f) => f.label.toLowerCase()).join(", ")}. Cuanto más alto sea tu Growwly Score, más probabilidades tienes de recibir leads extra.`;

/**
 * Sello gráfico del Growwly Score en el panel de la clínica — mide
 * cómo trabaja la clínica dentro de Growwly (no es lo mismo que el
 * Match Score, que mide cuánto encaja con un paciente en concreto).
 * Solo se enseña el total: el desglose por factor es información
 * interna para el reparto de leads, no algo que la clínica deba
 * "optimizar" número a número — aquí solo ve QUÉ factores cuentan.
 */
export function SelloGrowwlyScore({ score }: { score: GrowwlyScore }) {
  const [infoAbierta, setInfoAbierta] = useState(false);

  return (
    <div className="flex items-center gap-5 rounded-2xl bg-teal-dark p-5 md:w-[34%]">
      <SelloScore tipo="growwly" valor={score.total} size={110} />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-xl font-extrabold uppercase leading-tight text-orange">
            Growwly
            <br />
            Score
          </p>
          <span className="group relative shrink-0">
            <button
              type="button"
              onClick={() => setInfoAbierta((v) => !v)}
              onBlur={() => setInfoAbierta(false)}
              aria-label="Qué es el Growwly Score"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white transition hover:bg-white/25"
            >
              i
            </button>
            <span
              className={`popover-anim absolute right-0 top-full z-20 mt-2 w-60 rounded-xl border border-line bg-white p-3 text-left text-xs normal-case leading-relaxed text-ink shadow-lg transition ${
                infoAbierta
                  ? "block"
                  : "hidden group-hover:block"
              }`}
            >
              {TOOLTIP_TEXTO}
            </span>
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-white/85">
          Esta puntuación afecta directamente a la recepción extra de leads.
        </p>
      </div>
    </div>
  );
}
