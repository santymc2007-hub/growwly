"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Tarjeta plegable independiente (sin contexto compartido): antes esto
 * coordinaba varias secciones para que solo una estuviera abierta a la
 * vez, pero "Mis análisis" y "Mis presupuestos" pasaron a mostrarse
 * siempre visibles en dos columnas, así que solo queda "Mis datos
 * personales" usando el plegado — cada tarjeta gestiona su propio
 * estado.
 */
export function SeccionPlegable({
  id,
  titulo,
  icono,
  resumen,
  acciones,
  defaultAbierta = false,
  children,
}: {
  id?: string;
  titulo: string;
  icono: React.ReactNode;
  /** Se ve siempre, también plegada (p. ej. "3 análisis"). */
  resumen?: React.ReactNode;
  acciones?: React.ReactNode;
  defaultAbierta?: boolean;
  children: React.ReactNode;
}) {
  const [abierta, setAbierta] = useState(defaultAbierta);

  return (
    <section
      id={id}
      className="scroll-mt-6 overflow-hidden rounded-3xl border border-line bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-8">
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          aria-controls={id ? `${id}-contenido` : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-dim text-teal">
            {icono}
          </span>
          <span className="flex flex-col">
            <span className="font-display text-xl font-bold text-teal-dark">
              {titulo}
            </span>
            {resumen && (
              <span className="text-sm text-ink-soft">{resumen}</span>
            )}
          </span>
          <ChevronDown
            className={`ml-auto h-5 w-5 shrink-0 text-ink-soft transition-transform duration-200 ${abierta ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {acciones}
      </div>
      {abierta && (
        <div
          id={id ? `${id}-contenido` : undefined}
          className="popover-anim border-t border-line px-6 py-6 sm:px-8"
          style={{ transformOrigin: "top" }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
