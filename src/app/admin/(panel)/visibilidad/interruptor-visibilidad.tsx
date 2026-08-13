"use client";

import { useTransition } from "react";
import {
  alternarVisibilidad,
  rechazarVisibilidad,
  type TipoVisibilidad,
} from "./actions";

type Estado = "activo" | "inactivo" | "solicitado";

export function InterruptorVisibilidad({
  clinicId,
  tipo,
  estado,
}: {
  clinicId: string;
  tipo: TipoVisibilidad;
  estado: Estado;
}) {
  const [pending, startTransition] = useTransition();

  const activado = estado === "activo";
  const trackColor =
    estado === "activo"
      ? "bg-teal"
      : estado === "solicitado"
        ? "bg-orange"
        : "bg-line";

  function alternar() {
    startTransition(() => {
      alternarVisibilidad(clinicId, tipo, !activado);
    });
  }

  function rechazar(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(() => {
      rechazarVisibilidad(clinicId, tipo);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={alternar}
        disabled={pending}
        aria-pressed={activado}
        aria-label={activado ? "Desactivar" : "Activar"}
        title={
          estado === "solicitado"
            ? "Solicitado — clic para aprobar"
            : activado
              ? "Activo — clic para desactivar"
              : "Inactivo — clic para activar"
        }
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${trackColor}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            activado ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
      {estado === "solicitado" && (
        <button
          type="button"
          onClick={rechazar}
          disabled={pending}
          title="Rechazar la solicitud"
          className="text-xs text-ink-soft hover:text-error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
