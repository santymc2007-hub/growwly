"use client";

import { useState, useTransition } from "react";
import {
  activarVisibilidad,
  desactivarVisibilidad,
  rechazarVisibilidad,
  type TipoVisibilidad,
} from "./actions";

type Estado = "activo" | "inactivo" | "solicitado";

const VERDE = "#2fbf6b";

const DURACIONES: { meses: number | null; etiqueta: string }[] = [
  { meses: 1, etiqueta: "1 mes" },
  { meses: 3, etiqueta: "3 meses" },
  { meses: 6, etiqueta: "6 meses" },
  { meses: 12, etiqueta: "12 meses" },
  { meses: null, etiqueta: "Indefinido" },
];

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function InterruptorVisibilidad({
  clinicId,
  tipo,
  estado,
  expiraEn,
}: {
  clinicId: string;
  tipo: TipoVisibilidad;
  estado: Estado;
  expiraEn?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [eligiendoDuracion, setEligiendoDuracion] = useState(false);

  const activado = estado === "activo";

  function alClicarInterruptor() {
    if (activado) {
      startTransition(() => {
        desactivarVisibilidad(clinicId, tipo);
      });
    } else {
      setEligiendoDuracion(true);
    }
  }

  function elegirDuracion(meses: number | null) {
    setEligiendoDuracion(false);
    startTransition(() => {
      activarVisibilidad(clinicId, tipo, meses);
    });
  }

  function rechazar(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(() => {
      rechazarVisibilidad(clinicId, tipo);
    });
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={alClicarInterruptor}
          disabled={pending}
          aria-pressed={activado}
          aria-label={activado ? "Desactivar" : "Activar"}
          title={
            estado === "solicitado"
              ? "Solicitado — clic para elegir duración y aprobar"
              : activado
                ? "Activo — clic para desactivar"
                : "Inactivo — clic para elegir duración y activar"
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

      {activado && (
        <p className="mt-1 text-[11px] text-ink-soft">
          {expiraEn ? `Hasta ${formatearFecha(expiraEn)}` : "Indefinido"}
        </p>
      )}

      {eligiendoDuracion && (
        <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-xl border border-line bg-white p-2 shadow-lg">
          <p className="mb-1.5 px-1 text-[11px] font-medium text-ink-soft">
            ¿Durante cuánto?
          </p>
          {DURACIONES.map((d) => (
            <button
              key={d.etiqueta}
              type="button"
              onClick={() => elegirDuracion(d.meses)}
              className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-sage/40"
            >
              {d.etiqueta}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEligiendoDuracion(false)}
            className="mt-1 block w-full rounded-lg px-2 py-1.5 text-left text-xs text-ink-soft hover:bg-paper-dim"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
