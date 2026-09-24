"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LineaTiempoLead } from "@/components/leads/linea-tiempo-lead";
import type { PasoTimeline } from "@/lib/leads/linea-tiempo";

/**
 * Desplegable "Ver evolución" de una solicitud, para el listado del
 * panel de clínica. Botón hermano del <Link> de la tarjeta (no
 * anidado dentro), para que no interfiera con la navegación al hacer
 * clic en el resto de la fila.
 */
export function EvolucionLead({
  pasos,
  avisoNegativo,
}: {
  pasos: PasoTimeline[];
  avisoNegativo: string | null;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="mt-3 border-t border-line/60 pt-3">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-1 text-xs font-semibold text-teal-dark hover:text-teal"
      >
        {abierto ? "Ocultar evolución" : "Ver evolución"}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${abierto ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {abierto && (
        <div className="mt-2">
          <LineaTiempoLead pasos={pasos} avisoNegativo={avisoNegativo} />
        </div>
      )}
    </div>
  );
}
