"use client";

import { useTransition } from "react";
import {
  alternarVisibilidad,
  rechazarVisibilidad,
  type TipoVisibilidad,
} from "./actions";

type Estado = "activo" | "inactivo" | "solicitado";

const VERDE = "#2fbf6b";

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
    <div className="flex items-center gap-2">
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
        style={{
          backgroundColor:
            estado === "activo"
              ? VERDE
              : estado === "solicitado"
                ? "var(--color-orange)"
                : "var(--color-line)",
        }}
        className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-out"
          style={{
            transform: activado ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </button>
      {estado === "solicitado" && (
        <button
          type="button"
          onClick={rechazar}
          disabled={pending}
          title="Rechazar la solicitud"
          className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-ink-soft transition hover:bg-error/10 hover:text-error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
