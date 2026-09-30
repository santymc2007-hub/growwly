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
    <div className="flex items-center gap-5 rounded-2xl border border-yellow/40 bg-gradient-to-br from-yellow/15 via-white to-orange/10 p-5 md:w-[34%]">
      <SelloScore tipo="growwly" valor={score.total} size={132} />
      <div className="text-xs leading-relaxed text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="font-display text-base font-bold text-teal-dark">Tu Growwly Score</span>
          <span className="relative">
            <button
              type="button"
              onClick={() => setInfoAbierta((v) => !v)}
              onBlur={() => setInfoAbierta(false)}
              aria-label="Qué es el Growwly Score"
              className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-dark/15 text-[10px] font-bold text-teal-dark hover:bg-teal-dark/25"
            >
              i
            </button>
            {infoAbierta && (
              <span className="popover-anim absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl border border-line bg-white p-3 text-left text-xs normal-case text-ink shadow-lg">
                Puntuación de 0 a 100 sobre lo buena que eres como clínica
                partner de Growwly. Mejora tu posición en el reparto de leads
                cuanta más completa esté tu ficha, más rápido respondas y
                mejor gestiones cada solicitud.
              </span>
            )}
          </span>
        </span>
        Afecta a tu puntuación: {FACTORES.map((f) => f.label).join(", ")}.
      </div>
    </div>
  );
}
