"use client";

import { useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { activarVisibilidad, desactivarVisibilidad, rechazarVisibilidad } from "./actions";
import type { TipoVisibilidad } from "./tipos-visibilidad";

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
  mesesSolicitados,
}: {
  clinicId: string;
  tipo: TipoVisibilidad;
  estado: Estado;
  expiraEn?: string | null;
  mesesSolicitados?: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [eligiendoDuracion, setEligiendoDuracion] = useState(false);
  const [posicionPopover, setPosicionPopover] = useState({ top: 0, left: 0 });
  const [error, setError] = useState<string | null>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  const activado = estado === "activo";

  // Antes estas llamadas no se esperaban dentro de startTransition (una
  // función normal que invocaba la Server Action sin "await" ni
  // devolver su promesa): React daba por terminada la transición al
  // instante, el botón se quedaba "pending: false" aunque el guardado
  // siguiera en marcha de fondo, y si algo fallaba no había ningún
  // aviso ni se volvía a intentar — solo se veía como que "no hacía
  // nada". Al pasar una función async, React sí espera a que la
  // promesa termine antes de quitar el estado de pending.
  function alClicarInterruptor() {
    setError(null);
    if (activado) {
      startTransition(async () => {
        try {
          await desactivarVisibilidad(clinicId, tipo);
        } catch (e) {
          setError(e instanceof Error ? e.message : "No se ha podido desactivar.");
        }
      });
    } else {
      // El popover se saca de la tabla con un portal (ver abajo) porque
      // el contenedor con scroll horizontal de la tabla (overflow-x-auto)
      // también recorta el desbordamiento vertical — sin esto, el
      // desplegable quedaba invisible y parecía que no pasaba nada al
      // pulsar "Activar".
      //
      // El popover usa "position: fixed", que ya se posiciona respecto
      // al viewport — getBoundingClientRect() también es relativo al
      // viewport, así que sumarle window.scrollY/scrollX lo desplazaba
      // de más cuanto más scroll llevara la página (muy visible en el
      // último interruptor de la fila/ficha, como "Perfil ampliado").
      const rect = botonRef.current?.getBoundingClientRect();
      if (rect) {
        setPosicionPopover({ top: rect.bottom + 4, left: rect.left });
      }
      setEligiendoDuracion(true);
    }
  }

  function elegirDuracion(meses: number | null) {
    setEligiendoDuracion(false);
    setError(null);
    startTransition(async () => {
      try {
        await activarVisibilidad(clinicId, tipo, meses);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se ha podido activar.");
      }
    });
  }

  function rechazar(e: React.MouseEvent) {
    e.stopPropagation();
    setError(null);
    startTransition(async () => {
      try {
        await rechazarVisibilidad(clinicId, tipo);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se ha podido rechazar.");
      }
    });
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          ref={botonRef}
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
          className="press relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60"
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

      {error && <p className="mt-1 max-w-[9rem] text-[11px] text-error">{error}</p>}

      {eligiendoDuracion &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setEligiendoDuracion(false)}
            />
            <div
              className="popover-anim fixed z-40 w-44 rounded-xl border border-line bg-white p-2 shadow-lg"
              style={{ top: posicionPopover.top, left: posicionPopover.left }}
            >
              <p className="mb-1.5 px-1 text-[11px] font-medium text-ink-soft">
                ¿Durante cuánto?
              </p>
              {mesesSolicitados !== undefined && (
                <p className="mb-1.5 px-1 text-[11px] text-orange">
                  La clínica pidió:{" "}
                  {mesesSolicitados === null
                    ? "Indefinido"
                    : `${mesesSolicitados} ${mesesSolicitados === 1 ? "mes" : "meses"}`}
                </p>
              )}
              {DURACIONES.map((d) => (
                <button
                  key={d.etiqueta}
                  type="button"
                  onClick={() => elegirDuracion(d.meses)}
                  className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sage/40 ${
                    mesesSolicitados !== undefined && mesesSolicitados === d.meses
                      ? "bg-orange/10 font-medium text-orange"
                      : "text-ink"
                  }`}
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
          </>,
          document.body,
        )}
    </div>
  );
}
